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

// タグは可変個・自由入力(src/lib/timer-actions.tsのcreateTagAction)のため、あらかじめ色を
// 割り当てておけない。タグ名の文字コードから機械的にパレット内の色を選ぶことで、
// 同じ名前のタグは(再読み込みや、じぶん/パートナー間でも)常に同じ色になるようにする。
const TAG_COLOR_PALETTE = [
  PALETTE.pinkDeep,
  PALETTE.lavender,
  PALETTE.mint,
  PALETTE.apricot,
  "#C48A9E", // ローズ(pinkDeepより深め)
  "#8FA8D6", // ペリウィンクル
  "#7FB89A", // フォレストミント
  "#D9A441", // マスタード
] as const;

export const NO_TAG_COLOR = PALETTE.charcoalSoft;

export function tagColor(tagName: string): string {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = (hash * 31 + tagName.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % TAG_COLOR_PALETTE.length;
  return TAG_COLOR_PALETTE[index];
}
