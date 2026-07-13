import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getOptionalCurrentUser } from "@/lib/dal";

export const metadata: Metadata = {
  title: "べんきょうさぎ",
  description: "勉強するとうさぎがしあわせになる、ふたりの勉強継続アプリ",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 2026-07-14: ふたり比較ウィジェットはスマホだと全ページ常時表示が邪魔・見づらいとの
  // フィードバックにより、ホーム画面(src/app/page.tsx)内だけの表示に変更。
  // ホームへ戻るフローティングボタンは引き続き全ページ共通で表示する。
  const user = await getOptionalCurrentUser();
  const showHomeButton = Boolean(user?.rabbit?.onboardedAt);

  return (
    <html lang="ja" className="h-full antialiased">
      <head>
        {/*
          next/font/google はこのフォントに "japanese" サブセットを提供していないため
          （latin/cyrillic 等のみ。日本語グリフが欠落し文字化けする）、
          標準の <link> 経由で読み込む。
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&family=Zen+Maru+Gothic:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <main className="flex flex-1 flex-col">{children}</main>

        {showHomeButton && (
          <Link
            href="/"
            aria-label="ホームへもどる"
            className="fixed bottom-4 left-4 z-30 flex items-center gap-1.5 rounded-full bg-milk/95 px-4 py-2.5 text-sm font-bold text-charcoal shadow-md ring-1 ring-pink-deep/20 backdrop-blur transition-transform active:scale-95 sm:hover:scale-105"
          >
            🏠 ホーム
          </Link>
        )}
      </body>
    </html>
  );
}
