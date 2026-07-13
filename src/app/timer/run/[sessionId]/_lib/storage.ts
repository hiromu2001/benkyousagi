// タイマー実行状態のlocalStorage永続化(REQUIREMENTS.md 4章: リロード/再訪時の復元)。
// エポックms基準の値のみを保持するため、保存されたJSONをそのまま復元しても
// 「今」との差分計算で正しい経過時間が再計算される。

import type { EngineState } from "./engine";

const STORAGE_PREFIX = "benkyousagi:timer:";

function storageKey(sessionId: string): string {
  return `${STORAGE_PREFIX}${sessionId}`;
}

export function saveEngineState(state: EngineState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(state.sessionId), JSON.stringify(state));
  } catch {
    // localStorageが使えない環境(プライベートモード等)でも計測自体は継続させる。
  }
}

export function loadEngineState(sessionId: string): EngineState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EngineState;
    if (!parsed || typeof parsed !== "object" || parsed.sessionId !== sessionId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearEngineState(sessionId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(sessionId));
  } catch {
    // no-op
  }
}
