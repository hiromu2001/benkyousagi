"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { discardSessionAction } from "@/lib/timer-actions";
import { clearEngineState } from "../_lib/storage";

// レイアウト共通のHomeButton(src/components/HomeButton.tsx)は、この画面では
// 出さないよう除外している(pathname判定)。終了ボタンを押さずにホームへ離脱すると
// 記録がまだ確定しない(3-3節)ため、離脱前にひとこと確認してから戻す。
// 「あとで再開できる離脱」と「間違って起動したので記録ごと消す離脱」を明確に分けて
// 提示する(前者を「記録せず」と表現すると誤解を招くため)。
type Panel = "closed" | "leave" | "discard";

export default function TimerHomeButton({ sessionId }: { sessionId: string }) {
  const [panel, setPanel] = useState<Panel>("closed");
  const [isDiscarding, startDiscard] = useTransition();
  const router = useRouter();

  if (panel === "closed") {
    return (
      <button
        type="button"
        onClick={() => setPanel("leave")}
        aria-label="ホームへもどる"
        className="fixed bottom-4 left-4 z-30 flex items-center gap-1.5 rounded-full bg-milk/95 px-4 py-2.5 text-sm font-bold text-charcoal shadow-md ring-1 ring-pink-deep/20 backdrop-blur transition-transform active:scale-95 sm:hover:scale-105"
      >
        🏠 ホーム
      </button>
    );
  }

  if (panel === "discard") {
    return (
      <div className="fixed bottom-4 left-4 z-30 flex max-w-[calc(100vw-2rem)] flex-col gap-2 rounded-2xl bg-milk/95 p-3 shadow-md ring-1 ring-pink-deep/20 backdrop-blur sm:max-w-xs">
        <p className="text-xs leading-relaxed text-charcoal-soft">
          このタイマーの きろくを ぜんぶ けして、なかったことにするよ。あとから もとには もどせないよ。ほんとうに けす?
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setPanel("leave")}
            disabled={isDiscarding}
            className="rounded-full px-3 py-1.5 text-xs font-bold text-charcoal-soft active:scale-95"
          >
            もどる
          </button>
          <button
            type="button"
            disabled={isDiscarding}
            onClick={() => {
              startDiscard(async () => {
                clearEngineState(sessionId);
                try {
                  await discardSessionAction(sessionId);
                } catch {
                  // 削除に失敗しても、ホームに戻れば異常終了救済がいずれ拾ってくれる(3-3-1-8節)。
                }
                router.push("/");
              });
            }}
            className="rounded-full bg-pink-deep px-3 py-1.5 text-xs font-bold text-charcoal active:scale-95 disabled:opacity-60"
          >
            {isDiscarding ? "けしてるよ…" : "きろくをけす"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-30 flex max-w-[calc(100vw-2rem)] flex-col gap-2 rounded-2xl bg-milk/95 p-3 shadow-md ring-1 ring-pink-deep/20 backdrop-blur sm:max-w-xs">
      <p className="text-xs leading-relaxed text-charcoal-soft">
        いま ホームに もどっても、ここまでの きろくは きえないよ。あとで「つづきから」でさいかいできるから あんしんしてね。
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => setPanel("closed")}
          className="rounded-full px-3 py-1.5 text-xs font-bold text-charcoal-soft active:scale-95"
        >
          たいまーに もどる
        </button>
        <Link
          href="/"
          className="rounded-full bg-apricot px-3 py-1.5 text-xs font-bold text-charcoal active:scale-95"
        >
          ホームへ もどる
        </Link>
      </div>
      <button
        type="button"
        onClick={() => setPanel("discard")}
        className="self-start text-[11px] text-charcoal-soft underline-offset-2 hover:underline"
      >
        まちがえて はじめちゃった時は こちら
      </button>
    </div>
  );
}
