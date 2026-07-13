import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発中の右下(既定は左下)アイコンは本番ビルドには出ないが、
  // 見た目を常に確認したいこのプロジェクトでは開発中も非表示にしておく。
  devIndicators: false,
};

export default nextConfig;
