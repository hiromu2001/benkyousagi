"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { TimerType } from "@/generated/prisma";
import type { TimerType as TimerTypeValue } from "@/generated/prisma";
import type { PomodoroPresetConfig } from "@/lib/timer-config";
import {
  finalizeSession,
  recoverStaleSessionsForUser,
  type ManualEndReason,
} from "@/lib/session-finalize";

export type { ManualEndReason } from "@/lib/session-finalize";

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

export async function endSessionAction(
  sessionId: string,
  finalDurationSeconds: number,
  endReason: ManualEndReason,
): Promise<void> {
  const user = await getCurrentUser();
  await finalizeSession(user.id, sessionId, finalDurationSeconds, endReason);
}

// 3-3-1-8節: 異常終了時の救済。実体は session-finalize.ts(サーバー内部から直接呼ぶ用)。
export async function recoverStaleSessionsAction(): Promise<number> {
  const user = await getCurrentUser();
  return recoverStaleSessionsForUser(user.id);
}

// 所有者チェック: where に userId を含めることで、他ユーザーのタグは0件ヒットとなり削除されない。
// StudySessionTag は Prisma スキーマの onDelete: Cascade により連動削除される(過去セッション本体は残る)。
export async function deleteTagAction(tagId: string): Promise<void> {
  const user = await getCurrentUser();
  await db.tag.deleteMany({
    where: { id: tagId, userId: user.id },
  });
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

  // 体感速度優先: 先に事前チェックせず、まずcreateを試す(新規タグの通常経路はDB往復1回で済む)。
  // @@unique([userId, name]) 競合(既存名・同時作成)時のみ既存タグを取得して返す。
  try {
    const tag = await db.tag.create({
      data: { userId: user.id, name: trimmed },
    });
    return { id: tag.id, name: tag.name };
  } catch {
    const existing = await db.tag.findUnique({
      where: { userId_name: { userId: user.id, name: trimmed } },
    });
    if (existing) return { id: existing.id, name: existing.name };
    throw new Error("タグの作成に失敗しました");
  }
}
