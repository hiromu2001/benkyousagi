// タイマー機能の定数・設定値。
// 参照: docs/REQUIREMENTS.md 3-2, 3-3節。数値は10-2節により実装時調整を許容された目安値。

export const INACTIVITY_THRESHOLD_MS = 3 * 60 * 60 * 1000; // 3-3-1-2: 計測中3時間で確認ダイアログ
export const INACTIVITY_GRACE_MS = 5 * 60 * 1000; // 3-3-1-6: ダイアログ表示から5分無応答で自動終了
export const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 3-3-1: 計測中のみ60秒ごとにハートビート送信

// 3-3-1-8: 異常終了救済のしきい値。3時間監視+5分猶予+5分バッファ=3時間10分。
// 正常稼働中のセッション(60秒ごとにハートビートが来る)を誤って救済しないよう十分な余裕を持たせる。
export const STALE_SESSION_RECOVERY_MS =
  INACTIVITY_THRESHOLD_MS + INACTIVITY_GRACE_MS + 5 * 60 * 1000;

// 10-2節: カウントダウンの設定可能範囲は実装裁量。無操作しきい値(3時間)と揃えて上限とする。
export const COUNTDOWN_MIN_MINUTES = 1;
export const COUNTDOWN_MAX_MINUTES = 180;

// REQUIREMENTS.md 3-3-2節: 手入力での事後記録の1回あたり上限(入力ミスの歯止め、実装時に調整可能)。
export const MANUAL_ENTRY_MAX_MINUTES = 720;

export type PomodoroPresetId = "A" | "B";

export type PomodoroPresetConfig = {
  work: number; // 秒
  shortBreak: number; // 秒
  long: number; // 秒
  setsUntilLong: number;
};

// 10-2節: 長休憩の長さは目安15〜20分程度。15分を採用。
export const POMODORO_LONG_BREAK_SECONDS = 15 * 60;
export const POMODORO_SETS_UNTIL_LONG = 4;

export const POMODORO_PRESETS: Record<PomodoroPresetId, PomodoroPresetConfig> = {
  A: {
    work: 25 * 60,
    shortBreak: 5 * 60,
    long: POMODORO_LONG_BREAK_SECONDS,
    setsUntilLong: POMODORO_SETS_UNTIL_LONG,
  },
  B: {
    work: 50 * 60,
    shortBreak: 10 * 60,
    long: POMODORO_LONG_BREAK_SECONDS,
    setsUntilLong: POMODORO_SETS_UNTIL_LONG,
  },
};

export const POMODORO_PRESET_LABELS: Record<PomodoroPresetId, string> = {
  A: "コツコツ (作業25分 / 短休憩5分)",
  B: "じっくり (作業50分 / 短休憩10分)",
};
