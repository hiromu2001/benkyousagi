import Link from "next/link";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import {
  computeCurrentEnergy,
  energyStage,
  ENERGY_STAGE_LABELS,
  type EnergyStage,
} from "@/lib/rabbit-status";
import { logoutAction } from "@/lib/auth-actions";
import { recoverStaleSessionsForUser } from "@/lib/session-finalize";
import { jstDateKey } from "@/lib/jst";
import { asMoodLevel } from "@/lib/mood";
import ComparisonWidget from "@/components/comparison/ComparisonWidget";
import MoodCheckInClient from "./MoodCheckInClient";

const STAGE_MESSAGES: Record<EnergyStage, string> = {
  6: "きょうもいっしょに、きらきらだね！",
  5: "るんるん きぶんが いいみたい",
  4: "にこにこ ごきげんだね",
  3: "のんびり まったりしてるよ",
  2: "ちょっぴり しゅんとしてるかも…",
  1: "まってたよ…また いっしょに はじめよっか",
};

export default async function Home() {
  const user = await getCurrentUser();
  const rabbit = user.rabbit;

  // 3-3-1-8: アプリを閉じたまま放置されたセッションを、次回起動(=ホーム到達)時に救済確定する。
  // 表示する元気度は上のgetCurrentUser()で取得済みの値なので、救済のDB往復で描画をブロックしない
  // (after()でレスポンス送信後に実行。結果は次回以降の描画に反映される)。
  after(() => recoverStaleSessionsForUser(user.id).catch(() => {}));

  if (!rabbit) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-charcoal">うさぎの じゅんび中だよ。すこし まってね。</p>
      </main>
    );
  }

  if (!rabbit.onboardedAt) {
    redirect("/onboarding");
  }

  const energy = computeCurrentEnergy(rabbit.energy, rabbit.lastSessionEndAt);
  const stage = energyStage(energy);
  const stageLabel = ENERGY_STAGE_LABELS[stage];
  const message = STAGE_MESSAGES[stage];

  // きょう(JST基準)のきぶんチェックイン(未回答ならピッカーを表示)と、計測中セッションの有無を
  // 並行して取得する。後者が無いと、ホームボタンでタイマー画面から離脱した後にセッションが
  // 計測中であることに気づけない(REQUIREMENTS.md 4章: 計測状態が失われないこと、の体感を補強)。
  const [todayMood, activeSession] = await Promise.all([
    db.moodEntry.findUnique({
      where: { userId_moodDate: { userId: user.id, moodDate: jstDateKey() } },
    }),
    db.studySession.findFirst({
      where: { userId: user.id, endedAt: null },
      select: { id: true },
    }),
  ]);
  const initialMoodLevel = asMoodLevel(todayMood?.level);

  return (
    <div className="relative flex flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, var(--color-pink) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 px-5 pt-4 sm:px-8">
        <ComparisonWidget />
      </div>

      <header className="relative z-10 flex items-center justify-between px-5 pt-3 sm:px-8">
        <p className="text-sm text-charcoal-soft">
          おかえり、<span className="font-bold text-charcoal">{user.displayName}</span>さん
        </p>
        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            className="rounded-full px-3 py-1.5 text-xs text-charcoal-soft transition-colors hover:bg-pink/40 active:scale-95"
          >
            せってい
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full px-3 py-1.5 text-xs text-charcoal-soft transition-colors hover:bg-pink/40 active:scale-95"
            >
              ログアウト
            </button>
          </form>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-6 pb-10 text-center">
        <MoodCheckInClient
          energy={energy}
          rabbitName={rabbit.name}
          ribbonColor={rabbit.ribbonColor}
          stageLabel={stageLabel}
          stageMessage={message}
          initialMoodLevel={initialMoodLevel}
        />

        <Link
          href={activeSession ? `/timer/run/${activeSession.id}` : "/timer"}
          className="mt-2 w-full rounded-full bg-apricot px-8 py-4 text-center text-lg font-bold text-charcoal shadow-md transition-transform active:scale-95 sm:hover:scale-[1.02]"
        >
          {activeSession ? "つづきからはじめる" : "タイマーをはじめる"}
        </Link>

        <nav className="mt-2 flex gap-5 text-sm text-charcoal-soft">
          <Link href="/history" className="underline-offset-4 hover:underline">
            きろくをみる
          </Link>
          <Link href="/compare" className="underline-offset-4 hover:underline">
            ふたりをみる
          </Link>
        </nav>
      </main>
    </div>
  );
}
