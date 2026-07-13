"use server";

import { startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { TimerType, EndReason } from "@/generated/prisma";
import type { TimerType as TimerTypeValue } from "@/generated/prisma";
import {
  energyAfterSessionStart,
  energyGainForDuration,
  clampEnergy,
} from "@/lib/rabbit-status";
import {
  STALE_SESSION_RECOVERY_MS,
  type PomodoroPresetConfig,
} from "@/lib/timer-config";

export type ManualEndReason = "COMPLETED" | "MANUAL" | "INACTIVITY_AUTO";

// 3-2節: セッション作成のみ行う。元気度のDB書き込みはここでは行わない
// (開始ボーナスは終了時にまとめて加算する。REQUIREMENTS.md 3-4節参照)。
export async function startSessionAction(
  timerType: TimerTypeValue,
  targetSeconds: number | null,
  pomodoroPreset: PomodoroPresetConfig | null,
  tagIds: string[],
): Promise<{ sessionId: string }> {
  const user = await getCurrentUser();

  if (timerType === TimerType.COUNTDOWN) {
    if (!targetSeconds || !Number.isFinite(targetSeconds) || targetSeconds <= 0) {
      throw new Error("カウントダウンの目標時間を設定してください");
    }
  }

  if (timerType === TimerType.POMODORO) {
    if (
      !pomodoroPreset ||
      pomodoroPreset.work <= 0 ||
      pomodoroPreset.shortBreak <= 0 ||
      pomodoroPreset.long <= 0 ||
      pomodoroPreset.setsUntilLong <= 0
    ) {
      throw new Error("ポモドーロのプリセットを設定してください");
    }
  }

  const uniqueTagIds = [...new Set(tagIds)];
  let ownedTagIds: string[] = [];
  if (uniqueTagIds.length > 0) {
    const ownedTags = await db.tag.findMany({
      where: { id: { in: uniqueTagIds }, userId: user.id },
      select: { id: true },
    });
    ownedTagIds = ownedTags.map((tag) => tag.id);
  }

  const now = new Date();
  const session = await db.studySession.create({
    data: {
      userId: user.id,
      timerType,
      startedAt: now,
      lastHeartbeatAt: now,
      accumulatedSeconds: 0,
      tags:
        ownedTagIds.length > 0
          ? { create: ownedTagIds.map((tagId) => ({ tagId })) }
          : undefined,
    },
    select: { id: true },
  });

  return { sessionId: session.id };
}

// 3-3-1節: 計測中のみ60秒ごとに呼ばれる軽量action。lastHeartbeatAt/accumulatedSecondsの更新のみ行う。
export async function heartbeatAction(
  sessionId: string,
  accumulatedSeconds: number,
): Promise<void> {
  const user = await getCurrentUser();
  const safeSeconds = Math.max(0, Math.floor(accumulatedSeconds));

  await db.studySession.updateMany({
    where: { id: sessionId, userId: user.id, endedAt: null },
    data: { lastHeartbeatAt: new Date(), accumulatedSeconds: safeSeconds },
  });
}

// heartbeatActionを「軽量」に保つため、ポモドーロの進捗(完了セット数・休憩スキップ数)は
// 専用の軽量actionで随時同期する(セット完了・スキップの都度呼ばれる想定)。
export async function updatePomodoroProgressAction(
  sessionId: string,
  pomodoroSetsCompleted: number,
  breaksSkipped: number,
): Promise<void> {
  const user = await getCurrentUser();

  await db.studySession.updateMany({
    where: { id: sessionId, userId: user.id, endedAt: null },
    data: {
      pomodoroSetsCompleted: Math.max(0, Math.floor(pomodoroSetsCompleted)),
      breaksSkipped: Math.max(0, Math.floor(breaksSkipped)),
    },
  });
}

// endSessionAction / recoverStaleSessionsAction 共通の確定処理(3-3-1, 3-4節)。
// (a) StudySessionを確定 (b) Rabbitの元気度を更新 (c) 当日のDailyAggregateへ加算。
async function finalizeSession(
  userId: string,
  sessionId: string,
  finalDurationSeconds: number,
  endReason: ManualEndReason | typeof EndReason.RECOVERED,
): Promise<void> {
  await db.$transaction(async (tx) => {
    const session = await tx.studySession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session || session.endedAt) return; // 存在しない/既に確定済みなら何もしない(二重加算防止)

    const now = new Date();
    // クライアント申告値は開始時刻からの経過実時間を超えられない(改ざん防止、REQUIREMENTS.md 3-3節)。
    const maxPossibleSeconds = Math.max(
      0,
      Math.floor((now.getTime() - session.startedAt.getTime()) / 1000),
    );
    const duration = Math.max(
      0,
      Math.min(Math.floor(finalDurationSeconds), maxPossibleSeconds),
    );

    await tx.studySession.update({
      where: { id: sessionId },
      data: { endedAt: now, durationSeconds: duration, endReason },
    });

    const rabbit = await tx.rabbit.findUnique({ where: { userId } });
    if (rabbit) {
      // Rabbit.energy は「lastSessionEndAt時点の確定値」(schema.prisma参照)。
      // 減衰は読み取り時のみ computeCurrentEnergy() で計算するため、ここでは生値をそのまま起点にする。
      const afterStartBonus = energyAfterSessionStart(rabbit.energy);
      const newEnergy = clampEnergy(afterStartBonus + energyGainForDuration(duration));
      await tx.rabbit.update({
        where: { userId },
        data: { energy: newEnergy, lastSessionEndAt: now },
      });
    }

    // 集計日はセッション開始日(startedAt)基準に統一する(src/lib/study-stats.tsの可視化側と揃える)。
    const dateKey = startOfDay(session.startedAt);
    await tx.dailyAggregate.upsert({
      where: { userId_date: { userId, date: dateKey } },
      update: {
        totalSeconds: { increment: duration },
        sessionCount: { increment: 1 },
      },
      create: {
        userId,
        date: dateKey,
        totalSeconds: duration,
        sessionCount: 1,
      },
    });
  });
}

export async function endSessionAction(
  sessionId: string,
  finalDurationSeconds: number,
  endReason: ManualEndReason,
): Promise<void> {
  const user = await getCurrentUser();
  await finalizeSession(user.id, sessionId, finalDurationSeconds, endReason);
}

// 3-3-1-8節: 異常終了時の救済。endedAt=nullかつlastHeartbeatAtが古すぎるセッションを検知し確定する。
export async function recoverStaleSessionsAction(): Promise<number> {
  const user = await getCurrentUser();
  const staleBefore = new Date(Date.now() - STALE_SESSION_RECOVERY_MS);

  const staleSessions = await db.studySession.findMany({
    where: {
      userId: user.id,
      endedAt: null,
      lastHeartbeatAt: { lt: staleBefore },
    },
    select: { id: true, accumulatedSeconds: true },
  });

  for (const staleSession of staleSessions) {
    await finalizeSession(
      user.id,
      staleSession.id,
      staleSession.accumulatedSeconds,
      EndReason.RECOVERED,
    );
  }

  return staleSessions.length;
}

export async function createTagAction(
  name: string,
): Promise<{ id: string; name: string }> {
  const user = await getCurrentUser();
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("タグ名を入力してください");
  }
  if (trimmed.length > 20) {
    throw new Error("タグ名は20文字以内にしてください");
  }

  const existing = await db.tag.findUnique({
    where: { userId_name: { userId: user.id, name: trimmed } },
  });
  if (existing) {
    return { id: existing.id, name: existing.name };
  }

  try {
    const tag = await db.tag.create({
      data: { userId: user.id, name: trimmed },
    });
    return { id: tag.id, name: tag.name };
  } catch {
    // @@unique([userId, name]) 競合(同時作成)時は既存を再取得して返す。
    const fallback = await db.tag.findUnique({
      where: { userId_name: { userId: user.id, name: trimmed } },
    });
    if (fallback) return { id: fallback.id, name: fallback.name };
    throw new Error("タグの作成に失敗しました");
  }
}
