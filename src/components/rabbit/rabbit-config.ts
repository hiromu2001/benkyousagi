// うさぎの見た目・アニメーションパラメータを表情段階(1-6)ごとに定義するデータテーブル。
// 段階の判定自体は src/lib/rabbit-status.ts の energyStage() を正とし、ここでは再実装しない。
// 参照: docs/REQUIREMENTS.md 2-3節(表情バリエーション)

import type { EnergyStage } from "@/lib/rabbit-status";

export type MouthShape = "omegaSmall" | "he" | "omega" | "smileSmall" | "smileBig";

export type EyeShape =
  | "teary"
  | "sadDown"
  | "dot"
  | "dotHappy"
  | "curveHappy"
  | "sparkle";

export type StageConfig = {
  mouth: MouthShape;
  eyes: EyeShape;
  earRestDeg: number;
  earWiggleDeg: number;
  earWiggleDuration: number;
  breathScale: number;
  breathDuration: number;
  blinkDuration: number;
  sway: boolean;
  saturate: number;
  showBlanket: boolean;
  showWaitBubble: boolean;
  showSighBubble: boolean;
  showSparkleField: boolean;
  ambientHeart: boolean;
};

export const STAGE_CONFIG: Record<EnergyStage, StageConfig> = {
  1: {
    mouth: "omegaSmall",
    eyes: "teary",
    earRestDeg: 95,
    earWiggleDeg: 2,
    earWiggleDuration: 4.5,
    breathScale: 0.012,
    breathDuration: 3.6,
    blinkDuration: 5.2,
    sway: false,
    saturate: 0.88, // 2-3節: 彩度をわずかに落とす程度に留める(グレー化はしない)
    showBlanket: true,
    showWaitBubble: true,
    showSighBubble: false,
    showSparkleField: false,
    ambientHeart: false,
  },
  2: {
    mouth: "he",
    eyes: "sadDown",
    earRestDeg: 48,
    earWiggleDeg: 3,
    earWiggleDuration: 4,
    breathScale: 0.015,
    breathDuration: 3.3,
    blinkDuration: 4.4,
    sway: false,
    saturate: 1,
    showBlanket: false,
    showWaitBubble: false,
    showSighBubble: true,
    showSparkleField: false,
    ambientHeart: false,
  },
  3: {
    mouth: "omega",
    eyes: "dot",
    earRestDeg: 12,
    earWiggleDeg: 4,
    earWiggleDuration: 3.2,
    breathScale: 0.018,
    breathDuration: 3,
    blinkDuration: 3.8,
    sway: false,
    saturate: 1,
    showBlanket: false,
    showWaitBubble: false,
    showSighBubble: false,
    showSparkleField: false,
    ambientHeart: false,
  },
  4: {
    mouth: "smileSmall",
    eyes: "dotHappy",
    earRestDeg: 0,
    earWiggleDeg: 6,
    earWiggleDuration: 2.6,
    breathScale: 0.02,
    breathDuration: 2.6,
    blinkDuration: 3.2,
    sway: false,
    saturate: 1,
    showBlanket: false,
    showWaitBubble: false,
    showSighBubble: false,
    showSparkleField: false,
    ambientHeart: false,
  },
  5: {
    mouth: "smileBig",
    eyes: "curveHappy",
    earRestDeg: -8,
    earWiggleDeg: 10,
    earWiggleDuration: 1.6,
    breathScale: 0.024,
    breathDuration: 2.2,
    blinkDuration: 3,
    sway: true,
    saturate: 1,
    showBlanket: false,
    showWaitBubble: false,
    showSighBubble: false,
    showSparkleField: false,
    ambientHeart: false,
  },
  6: {
    mouth: "smileBig",
    eyes: "sparkle",
    earRestDeg: -10,
    earWiggleDeg: 12,
    earWiggleDuration: 1.3,
    breathScale: 0.026,
    breathDuration: 2,
    blinkDuration: 3,
    sway: true,
    saturate: 1,
    showBlanket: false,
    showWaitBubble: false,
    showSighBubble: false,
    showSparkleField: true,
    ambientHeart: true,
  },
};
