// デザイントークン(JS側)。CSS 側の正は src/app/globals.css の @theme ブロック。
// SVG fill / chart 色など、Tailwind クラスが使えない箇所から参照する。
// 参照: docs/REQUIREMENTS.md 2-5節

export const PALETTE = {
  milk: "#FFF9F5",
  pink: "#F5D0D8",
  pinkDeep: "#E9AEBB",
  lavender: "#CBBBE8",
  mint: "#BFE3D0",
  charcoal: "#6B5B5B",
  charcoalSoft: "#9A8A8A",
  apricot: "#F4B183",
} as const;

// うさぎの首元リボン/マフラーの色(2-2節: 個体差)。RibbonColor enum(Prisma)と対応。
export const RIBBON_COLOR_HEX = {
  PINK: PALETTE.pinkDeep,
  LAVENDER: PALETTE.lavender,
  MINT: PALETTE.mint,
  CREAM: "#F0E4D0",
} as const;

export const RIBBON_COLOR_LABELS = {
  PINK: "くすみピンク",
  LAVENDER: "ラベンダー",
  MINT: "ミント",
  CREAM: "クリーム",
} as const;
