import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { recoverStaleSessionsAction } from "@/lib/timer-actions";
import TimerSetupForm from "./_components/TimerSetupForm";

export default async function TimerSetupPage() {
  const user = await getCurrentUser();

  // 3-3-1-8節: 前回異常終了したセッションがあれば、設定画面を開いた時点で自動確定する。
  await recoverStaleSessionsAction();

  const [tags, activeSession] = await Promise.all([
    db.tag.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
    db.studySession.findFirst({
      where: { userId: user.id, endedAt: null },
      orderBy: { startedAt: "desc" },
      select: { id: true, timerType: true },
    }),
  ]);

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
