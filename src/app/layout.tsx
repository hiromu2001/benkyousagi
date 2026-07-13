import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getOptionalCurrentUser } from "@/lib/dal";
import ComparisonWidget from "@/components/comparison/ComparisonWidget";

export const metadata: Metadata = {
  title: "べんきょうさぎ",
  description: "勉強するとうさぎがしあわせになる、ふたりの勉強継続アプリ",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // REQUIREMENTS.md 3-6節: ふたり比較ウィジェットは全ページ共通で常時表示。
  // 未ログイン時(/login)は何も表示しない。オンボーディング未完了時はうさぎが
  // まだ「おもち」のダミー状態のため、比較ウィジェットとホームボタンは出さない。
  const user = await getOptionalCurrentUser();
  const showChrome = Boolean(user?.rabbit?.onboardedAt);

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
      <body className="min-h-full flex flex-col lg:flex-row">
        {showChrome && (
          <div className="sticky top-0 z-20 border-b border-pink-deep/15 bg-milk/95 px-3 py-2 backdrop-blur lg:hidden">
            <ComparisonWidget />
          </div>
        )}

        <main className="flex flex-1 flex-col">{children}</main>

        {showChrome && (
          <aside className="hidden shrink-0 lg:block lg:w-80 lg:p-4">
            <div className="lg:sticky lg:top-4">
              <ComparisonWidget />
            </div>
          </aside>
        )}

        {showChrome && (
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
