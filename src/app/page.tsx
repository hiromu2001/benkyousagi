import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import {
  computeCurrentEnergy,
  energyStage,
  ENERGY_STAGE_LABELS,
  type EnergyStage,
} from "@/lib/rabbit-status";
import { logoutAction } from "@/lib/auth-actions";
import { recoverStaleSessionsAction } from "@/lib/timer-actions";
import Rabbit from "@/components/rabbit/Rabbit";

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
  await recoverStaleSessionsAction();

  if (!rabbit) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-charcoal">うさぎの じゅんび中だよ。すこし まってね。</p>
      </main>
    );
  }

  const energy = computeCurrentEnergy(rabbit.energy, rabbit.lastSessionEndAt);
  const stage = energyStage(energy);
  const stageLabel = ENERGY_STAGE_LABELS[stage];
  const message = STAGE_MESSAGES[stage];

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

      <header className="relative z-10 flex items-center justify-between px-5 pt-5 sm:px-8">
        <p className="text-sm text-charcoal-soft">
          おかえり、<span className="font-bold text-charcoal">{user.displayName}</span>さん
        </p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full px-3 py-1.5 text-xs text-charcoal-soft transition-colors hover:bg-pink/40 active:scale-95"
          >
            ログアウト
          </button>
        </form>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-6 pb-10 text-center">
        <div className="flex flex-col items-center gap-1">
          <Rabbit energy={energy} name={rabbit.name} ribbonColor={rabbit.ribbonColor} size="lg" />
          <h1 className="mt-2 text-2xl font-bold text-charcoal">{rabbit.name}</h1>
          <span className="rounded-full bg-pink/60 px-3 py-1 text-xs font-bold text-charcoal-soft">
            いま: {stageLabel}
          </span>
        </div>

        <p className="max-w-xs text-sm leading-relaxed text-charcoal-soft">{message}</p>

        <Link
          href="/timer"
          className="mt-2 w-full rounded-full bg-apricot px-8 py-4 text-center text-lg font-bold text-charcoal shadow-md transition-transform active:scale-95 sm:hover:scale-[1.02]"
        >
          タイマーをはじめる
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
