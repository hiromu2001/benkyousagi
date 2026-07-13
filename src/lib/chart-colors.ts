import { PALETTE } from "@/lib/theme";

const FALLBACK_ORDER = [PALETTE.pinkDeep, PALETTE.lavender, PALETTE.mint, PALETTE.apricot] as const;

// 2人が同じリボン色を選んでいた場合でもグラフ上で見分けがつくよう、
// 衝突した側だけパレットの別の色に自動でずらす(色は常に「その人」に固定し、順位では変えない)。
export function resolveDistinctPersonColors(primaryHex: string, secondaryHex: string): [string, string] {
  if (primaryHex.toLowerCase() !== secondaryHex.toLowerCase()) {
    return [primaryHex, secondaryHex];
  }
  const fallback =
    FALLBACK_ORDER.find((c) => c.toLowerCase() !== primaryHex.toLowerCase()) ?? PALETTE.lavender;
  return [primaryHex, fallback];
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
