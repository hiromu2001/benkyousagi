import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { recoverStaleSessionsForUser } from "@/lib/session-finalize";
import TimerSetupForm from "./_components/TimerSetupForm";

async function findActiveSession(userId: string) {
  return db.studySession.findFirst({
    where: { userId, endedAt: null },
    orderBy: { startedAt: "desc" },
    select: { id: true, timerType: true },
  });
}

export default async function TimerSetupPage() {
  const user = await getCurrentUser();

  // 3-3-1-8節: 前回異常終了したセッションの救済確定は、タグ取得・計測中セッション確認と並列で行う
  // (直列にDB往復を重ねない)。救済が実際に起きた場合のみ、計測中セッションを取り直して整合させる。
  const [tags, activeSessionRaw, recoveredCount] = await Promise.all([
    db.tag.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
    findActiveSession(user.id),
    recoverStaleSessionsForUser(user.id),
  ]);
  const activeSession =
    recoveredCount > 0 && activeSessionRaw
      ? await findActiveSession(user.id)
      : activeSessionRaw;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-charcoal">きょうもいっしょにがんばろ</h1>
      <p className="mt-1 text-sm text-charcoal-soft">
        タイマーの種類とタグを選んで、はじめよう。
      </p>

      {activeSession && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-lavender/50 px-4 py-3">
          <p className="text-sm text-charcoal">
            すでに計測中のセッションがあるみたい。
          </p>
          <Link
            href={`/timer/run/${activeSession.id}`}
            className="shrink-0 rounded-full bg-milk px-4 py-2 text-sm font-bold text-charcoal shadow-sm active:scale-95"
          >
            再開する
          </Link>
        </div>
      )}

      <div className="mt-6">
        <TimerSetupForm initialTags={tags} />
      </div>
    </div>
  );
}
