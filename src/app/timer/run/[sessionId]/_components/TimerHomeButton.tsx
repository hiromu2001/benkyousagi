"use client";

import { useState } from "react";
import Link from "next/link";

// レイアウト共通のHomeButton(src/components/HomeButton.tsx)は、この画面では
// 出さないよう除外している(pathname判定)。終了ボタンを押さずにホームへ離脱すると
// 記録がまだ確定しない(3-3節)ため、離脱前にひとこと確認してから戻す。
export default function TimerHomeButton() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label="ホームへもどる"
        className="fixed bottom-4 left-4 z-30 flex items-center gap-1.5 rounded-full bg-milk/95 px-4 py-2.5 text-sm font-bold text-charcoal shadow-md ring-1 ring-pink-deep/20 backdrop-blur transition-transform active:scale-95 sm:hover:scale-105"
      >
        🏠 ホーム
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-30 flex max-w-[calc(100vw-2rem)] flex-col gap-2 rounded-2xl bg-milk/95 p-3 shadow-md ring-1 ring-pink-deep/20 backdrop-blur sm:max-w-xs">
      <p className="text-xs leading-relaxed text-charcoal-soft">
        いま もどると、ここまでの きろくは まだ かくていしないよ。あとで「つづきから」でさいかいできるから あんしんしてね。ほんとうに もどる?
      </p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-full px-3 py-1.5 text-xs font-bold text-charcoal-soft active:scale-95"
        >
          たいまーに もどる
        </button>
        <Link
          href="/"
          className="rounded-full bg-apricot px-3 py-1.5 text-xs font-bold text-charcoal active:scale-95"
        >
          きろくせず ホームへ
        </Link>
      </div>
    </div>
  );
}
