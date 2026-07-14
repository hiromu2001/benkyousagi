import "server-only";
import { startOfJstDay } from "@/lib/jst";
import { db } from "@/lib/db";
import { EndReason, CoinReason, TimerType } from "@/generated/prisma";
import {
  computeCurrentEnergy,
  energyAfterSessionStart,
  energyGainForDuration,
  clampEnergy,
} from "@/lib/rabbit-status";
import { STALE_SESSION_RECOVERY_MS } from "@/lib/timer-config";
import { COIN_PER_MINUTE, COIN_COMPLETION_BONUS } from "@/lib/shop";

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
      // ここで生値をそのまま起点にすると、前回セッション終了からの減衰分が丸ごと消えてしまう
      // (クライアント側の楽観的表示は開始時点の減衰後の値を起点に計算しているため食い違う)。
      // セッション開始時刻(startedAt)時点まで減衰させた値を起点にする。
      const baselineEnergy = computeCurrentEnergy(rabbit.energy, rabbit.lastSessionEndAt, session.startedAt);
      const afterStartBonus = energyAfterSessionStart(baselineEnergy);
      const newEnergy = clampEnergy(afterStartBonus + energyGainForDuration(duration));
      await tx.rabbit.update({
        where: { userId },
        data: { energy: newEnergy, lastSessionEndAt: now },
      });
    }

    // 集計日はセッション開始日(startedAt)基準に統一する(src/lib/study-stats.tsの可視化側と揃える)。
    // 日本時間(JST)基準の暦日境界を使う(src/lib/jst.ts参照。本番サーバーTZがUTCのため)。
    const dateKey = startOfJstDay(session.startedAt);
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

    // REQUIREMENTS.md 3-7-2節: コインは元気度と完全に分離した独立レイヤー(勝手に変換しない)。
    // 開始→即終了の連打が採掘手段にならないよう、開始ボーナスは設けず実勉強時間分のみ加算する。
    const baseCoins = Math.floor(duration / 60) * COIN_PER_MINUTE;
    const bonusCoins = endReason === EndReason.COMPLETED ? COIN_COMPLETION_BONUS : 0;
    const earnedCoins = baseCoins + bonusCoins;
    if (earnedCoins > 0) {
      if (baseCoins > 0) {
        await tx.coinTransaction.create({
          data: { userId, amount: baseCoins, reason: CoinReason.STUDY_SESSION, refId: sessionId },
        });
      }
      if (bonusCoins > 0) {
        await tx.coinTransaction.create({
          data: { userId, amount: bonusCoins, reason: CoinReason.COMPLETION_BONUS, refId: sessionId },
        });
      }
      await tx.user.update({
        where: { id: userId },
        data: { coinBalance: { increment: earnedCoins } },
      });
    }
  });
}

// REQUIREMENTS.md 3-3-2節: タイマーを起動し忘れた分の事後手入力。finalizeSession()と違い、
// 更新対象となる「計測中セッション」が存在しない(そもそも計測していない)ため、経過実時間による
// クランプは行わず、常に「いま」を開始・終了時刻とするセッションを新規作成する。
// 過去日への遡り入力を許さないのは、Rabbit.lastSessionEndAt(3-4節)が過去に巻き戻ると
// 減衰計算の前提(単調増加)が崩れるため。元気度・当日集計・コイン加算はfinalizeSessionと
// 同じ計算式を用いる(手入力だけ うさぎの状態が更新されない、という抜け漏れを避ける)。
export async function logManualSession(
  userId: string,
  durationSeconds: number,
  tagIds: string[],
): Promise<{ earnedCoins: number }> {
  const now = new Date();
  const duration = Math.max(0, Math.floor(durationSeconds));

  return db.$transaction(async (tx) => {
    const session = await tx.studySession.create({
      data: {
        userId,
        timerType: TimerType.COUNTUP,
        startedAt: now,
        endedAt: now,
        lastHeartbeatAt: now,
        accumulatedSeconds: duration,
        durationSeconds: duration,
        endReason: EndReason.MANUAL_ENTRY,
        tags: tagIds.length > 0 ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      },
      select: { id: true },
    });

    const rabbit = await tx.rabbit.findUnique({ where: { userId } });
    if (rabbit) {
      const baselineEnergy = computeCurrentEnergy(rabbit.energy, rabbit.lastSessionEndAt, now);
      const afterStartBonus = energyAfterSessionStart(baselineEnergy);
      const newEnergy = clampEnergy(afterStartBonus + energyGainForDuration(duration));
      await tx.rabbit.update({
        where: { userId },
        data: { energy: newEnergy, lastSessionEndAt: now },
      });
    }

    const dateKey = startOfJstDay(now);
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

    // 3-3-2節: 完了ボーナスに相当する概念がないため、基本レート(1分+1コイン)のみ加算する。
    const earnedCoins = Math.floor(duration / 60) * COIN_PER_MINUTE;
    if (earnedCoins > 0) {
      await tx.coinTransaction.create({
        data: { userId, amount: earnedCoins, reason: CoinReason.STUDY_SESSION, refId: session.id },
      });
      await tx.user.update({
        where: { id: userId },
        data: { coinBalance: { increment: earnedCoins } },
      });
    }

    return { earnedCoins };
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
