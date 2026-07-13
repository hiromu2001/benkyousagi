// 「きょうのきぶん」チェックインの共通定義。
// サーバー(action/ページ)とクライアント(ピッカーUI)の両方から参照する定数のみを置く。
// うさぎの元気度6段階(rabbit-status.ts)とは独立した、1日1回の自己申告(4段階)。
// 4段階なのは「迷わず直感で選べる数」かつ 2x2 グリッドでボタンを大きく置けるため。

export const MOOD_LEVELS_DESC = [4, 3, 2, 1] as const;
export type MoodLevel = (typeof MOOD_LEVELS_DESC)[number];

export const MOOD_CONFIG: Record<
  MoodLevel,
  { label: string; emoji: string; pickerClass: string }
> = {
  4: { label: "さいこう！", emoji: "😆", pickerClass: "bg-apricot/50" },
  3: { label: "いいかんじ", emoji: "😊", pickerClass: "bg-mint/60" },
  2: { label: "まあまあ", emoji: "😌", pickerClass: "bg-lavender/50" },
  1: { label: "しょんぼり", emoji: "🥺", pickerClass: "bg-pink/60" },
};

// にんじんを食べたあとの、うさぎからのひとこと(選んだきぶんに寄り添う)。
export const MOOD_REPLIES: Record<MoodLevel, string> = {
  4: "わーい！さいこうな日に にんじんまで…しあわせ！",
  3: "いいかんじなんだね、えへへ。にんじん ありがとう！",
  2: "まあまあな日も だいじな一日だよ。もぐもぐ…",
  1: "そっかぁ…ぎゅっ。にんじん わけっこしよ？",
};

/** DBの生の数値などを MoodLevel に安全に絞り込む。範囲外は null。 */
export function asMoodLevel(value: number | null | undefined): MoodLevel | null {
  return value === 1 || value === 2 || value === 3 || value === 4 ? value : null;
}
