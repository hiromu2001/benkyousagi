import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "べんきょうさぎ",
  description: "勉強するとうさぎがしあわせになる、ふたりの勉強継続アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
