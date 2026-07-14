'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

// ホーム画面自体では「ホームへもどる」ボタンは冗長なので出さない。
// タイマー実行画面(/timer/run/[id])は、計測中に無確認でホームへ離脱されると記録が
// まだ確定していない状態になる(REQUIREMENTS.md 3-3節)ため、専用の確認つきボタン
// (TimerHomeButton, TimerRunClient.tsx)に譲り、こちらは出さない。
export function HomeButton() {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/timer/run/")) return null;

  return (
    <Link
      href="/"
      aria-label="ホームへもどる"
      className="fixed bottom-4 left-4 z-30 flex items-center gap-1.5 rounded-full bg-milk/95 px-4 py-2.5 text-sm font-bold text-charcoal shadow-md ring-1 ring-pink-deep/20 backdrop-blur transition-transform active:scale-95 sm:hover:scale-105"
    >
      🏠 ホーム
    </Link>
  );
}
