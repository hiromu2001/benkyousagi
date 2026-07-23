// うさぎの元気度・表情段階の計算ロジック（純関数）。
// 参照: docs/REQUIREMENTS.md 3-4節「うさぎステータス仕様」
// タイマー機能・うさぎコンポーネント・比較ウィジェットの全てがこのモジュールを共通の正とする。

export const ENERGY_MIN = 0;
export const ENERGY_MAX = 100;

// 2026-07-23: 20だと少しの勉強でも毎回ほぼ全回復し、lastSessionEndAtも更新されて
// 減衰の36時間カウントダウンが再スタートしてしまう(=「あんまり勉強してなくても
// 元気度が下がらない」というフィードバックの実質原因)。5に下げ、素の減衰が
// 体感できるようにする(30分勉強すれば+65回復するので、ちゃんと勉強した分の
// ご褒美感は変わらない)。
export const START_BONUS = 5; // セッション開始の瞬間に即時加算
export const PER_MINUTE_GAIN = 2; // 勉強1分につき加算

const DECAY_GRACE_MS = 12 * 60 * 60 * 1000; // 直近セッション終了から12時間は維持
const DECAY_INTERVAL_MS = 24 * 60 * 60 * 1000; // 以降24時間ごとに減衰
const DECAY_AMOUNT = 25;

export function clampEnergy(value: number): number {
  return Math.max(ENERGY_MIN, Math.min(ENERGY_MAX, Math.round(value)));
}

/**
 * 保存されている元気度(=直近セッション終了時点の値)から、現在時刻時点の
 * 元気度を計算する。DB は更新せず読み取り時に都度計算する(3-4節: 減衰ルール)。
 */
export function computeCurrentEnergy(
  storedEnergy: number,
  lastSessionEndAt: Date | null,
  now: Date = new Date(),
): number {
  if (!lastSessionEndAt) return clampEnergy(storedEnergy);

  const elapsedMs = now.getTime() - lastSessionEndAt.getTime();
  if (elapsedMs <= DECAY_GRACE_MS) return clampEnergy(storedEnergy);

  const decayPeriods = Math.floor((elapsedMs - DECAY_GRACE_MS) / DECAY_INTERVAL_MS);
  return clampEnergy(storedEnergy - decayPeriods * DECAY_AMOUNT);
}

/** セッション「開始」の瞬間に加算する分(3-4節: 開始ボーナス)。 */
export function energyAfterSessionStart(currentEnergy: number): number {
  return clampEnergy(currentEnergy + START_BONUS);
}

/** 確定した実勉強時間(秒)から加算する元気度分(3-4節: 加算ルール)。 */
export function energyGainForDuration(durationSeconds: number): number {
  return Math.floor(durationSeconds / 60) * PER_MINUTE_GAIN;
}

export type EnergyStage = 1 | 2 | 3 | 4 | 5 | 6;

export const ENERGY_STAGE_LABELS: Record<EnergyStage, string> = {
  6: "きらきら",
  5: "るんるん",
  4: "にこにこ",
  3: "ふつう",
  2: "しゅん",
  1: "まちぼうけ",
};

/** 元気度(0-100)から表情段階(1-6)を判定する(3-4節: 表情段階の閾値)。 */
export function energyStage(energy: number): EnergyStage {
  if (energy >= 95) return 6;
  if (energy >= 75) return 5;
  if (energy >= 55) return 4;
  if (energy >= 35) return 3;
  if (energy >= 15) return 2;
  return 1;
}
