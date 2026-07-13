import "server-only";
import { startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { EndReason } from "@/generated/prisma";
import {
  energyAfterSessionStart,
  energyGainForDuration,
  clampEnergy,
} from "@/lib/rabbit-status";
import { STALE_SESSION_RECOVERY_MS } from "@/lib/timer-config";

// timer-actions.ts("use server"ファイル)から切り出したセッション確定ロジック。
// "use server"ファイルのexportはすべてServer Action(公開POSTエンドポイント)になるため、
// userIdを引数に取る内部ヘルパーはここ(server-only)に置き、ページ/アクション双方から呼ぶ。

export type ManualEndReason = "COMPLETED" | "MANUAL" | "INACTIVITY_AUTO";

// endSessionAction / 異常終了救済 共通の確定処理(REQUIREMENTS.md 3-3-1, 3-4節)。
// (a) StudySessionを確定 (b) Rabbitの元気度を更新 (c) 当日のDailyAggregateへ加算。
export async function finalizeSession(
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

// 3-3-1-8節: 異常終了時の救済。endedAt=nullかつlastHeartbeatAtが古すぎるセッションを検知し確定する。
// 戻り値は救済した件数(0なら「救済は起きていない=直前に取得した表示用データは新鮮」と判断できる)。
export async function recoverStaleSessionsForUser(userId: string): Promise<number> {
  const staleBefore = new Date(Date.now() - STALE_SESSION_RECOVERY_MS);

  const staleSessions = await db.studySession.findMany({
    where: {
      userId,
      endedAt: null,
      lastHeartbeatAt: { lt: staleBefore },
    },
    select: { id: true, accumulatedSeconds: true },
  });

  for (const staleSession of staleSessions) {
    await finalizeSession(
      userId,
      staleSession.id,
      staleSession.accumulatedSeconds,
      EndReason.RECOVERED,
    );
  }

  return staleSessions.length;
}
