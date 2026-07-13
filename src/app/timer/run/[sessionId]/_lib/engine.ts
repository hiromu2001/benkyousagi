// タイマー実行画面の状態機械(純粋関数)。
// 参照: docs/REQUIREMENTS.md 3-2節(状態遷移表)、3-3-1節(無操作自動停止)。
// エポックms基準で時刻を扱うことで、タブが非アクティブ化/バックグラウンド化して
// setIntervalが間引かれても、次にチェックが走った時点で正しい経過時間を計算できる
// (3-3-1-3: 判定は純粋に経過時間ベース)。

import {
  INACTIVITY_GRACE_MS,
  INACTIVITY_THRESHOLD_MS,
} from "@/lib/timer-config";
import type { ManualEndReason } from "@/lib/timer-actions";

export type PomodoroPhase = "work" | "shortBreak" | "longBreak";
export type RunStatus = "running" | "paused";
export type EndingPhase = "active" | "finalizing" | "done";

export type DialogState =
  | { shown: false }
  | { shown: true; shownAtMs: number };

interface CommonState {
  sessionId: string;
  startedAtMs: number;
  dialog: DialogState;
  inactivityCheckpointMs: number;
  endingPhase: EndingPhase;
  pendingEndReason: ManualEndReason | null;
  pendingDurationMs: number | null;
}

export interface CountupState extends CommonState {
  timerType: "COUNTUP";
  runStatus: RunStatus;
  accumulatedMs: number;
  runningSinceMs: number | null;
}

export interface CountdownState extends CommonState {
  timerType: "COUNTDOWN";
  runStatus: RunStatus;
  targetMs: number;
  accumulatedMs: number;
  runningSinceMs: number | null;
}

export interface PomodoroState extends CommonState {
  timerType: "POMODORO";
  phase: PomodoroPhase;
  runStatus: RunStatus; // "work"フェーズのみ意味を持つ。休憩中は常にrunning扱い。
  setNumber: number;
  setsUntilLong: number;
  workMs: number;
  shortBreakMs: number;
  longBreakMs: number;
  phaseAccumulatedMs: number;
  runningSinceMs: number | null;
  confirmedWorkMs: number; // 完了済み作業セットの合計
  setsCompleted: number;
  breaksSkipped: number;
}

export type EngineState = CountupState | CountdownState | PomodoroState;

export type EngineAction =
  | { type: "TICK"; nowMs: number }
  | { type: "PAUSE"; nowMs: number }
  | { type: "RESUME"; nowMs: number }
  | { type: "SKIP_BREAK"; nowMs: number }
  | { type: "DIALOG_CONTINUE"; nowMs: number }
  | { type: "REQUEST_END"; nowMs: number }
  | { type: "FINALIZE_DONE" }
  | { type: "RESTORE"; state: EngineState };

export type CountdownInitConfig = { targetSeconds: number };
export type PomodoroInitConfig = {
  work: number;
  shortBreak: number;
  long: number;
  setsUntilLong: number;
};

export function buildInitialState(
  sessionId: string,
  timerType: "COUNTUP",
  startedAtMs: number,
  config: null,
): CountupState;
export function buildInitialState(
  sessionId: string,
  timerType: "COUNTDOWN",
  startedAtMs: number,
  config: CountdownInitConfig,
): CountdownState;
export function buildInitialState(
  sessionId: string,
  timerType: "POMODORO",
  startedAtMs: number,
  config: PomodoroInitConfig,
): PomodoroState;
export function buildInitialState(
  sessionId: string,
  timerType: "COUNTUP" | "COUNTDOWN" | "POMODORO",
  startedAtMs: number,
  config: CountdownInitConfig | PomodoroInitConfig | null,
): EngineState {
  const common: CommonState = {
    sessionId,
    startedAtMs,
    dialog: { shown: false },
    inactivityCheckpointMs: 0,
    endingPhase: "active",
    pendingEndReason: null,
    pendingDurationMs: null,
  };

  if (timerType === "COUNTDOWN") {
    const { targetSeconds } = config as CountdownInitConfig;
    return {
      ...common,
      timerType: "COUNTDOWN",
      runStatus: "running",
      targetMs: targetSeconds * 1000,
      accumulatedMs: 0,
      runningSinceMs: startedAtMs,
    };
  }

  if (timerType === "POMODORO") {
    const preset = config as PomodoroInitConfig;
    return {
      ...common,
      timerType: "POMODORO",
      phase: "work",
      runStatus: "running",
      setNumber: 1,
      setsUntilLong: preset.setsUntilLong,
      workMs: preset.work * 1000,
      shortBreakMs: preset.shortBreak * 1000,
      longBreakMs: preset.long * 1000,
      phaseAccumulatedMs: 0,
      runningSinceMs: startedAtMs,
      confirmedWorkMs: 0,
      setsCompleted: 0,
      breaksSkipped: 0,
    };
  }

  return {
    ...common,
    timerType: "COUNTUP",
    runStatus: "running",
    accumulatedMs: 0,
    runningSinceMs: startedAtMs,
  };
}

/** 「今この瞬間にセッションを終えたら記録される勉強時間(ms)」。表示・ハートビート・確定処理すべての共通の元になる値。 */
export function studyMsSoFar(state: EngineState, nowMs: number): number {
  if (state.timerType === "POMODORO") {
    const runningMs =
      state.phase === "work" &&
      state.runStatus === "running" &&
      state.runningSinceMs != null
        ? Math.max(0, nowMs - state.runningSinceMs)
        : 0;
    return state.confirmedWorkMs + state.phaseAccumulatedMs + runningMs;
  }
  const runningMs =
    state.runStatus === "running" && state.runningSinceMs != null
      ? Math.max(0, nowMs - state.runningSinceMs)
      : 0;
  return state.accumulatedMs + runningMs;
}

/** 現在フェーズ(休憩含む)の経過ms。休憩の残り時間表示に使う。 */
function currentPhaseElapsedMs(state: EngineState, nowMs: number): number {
  if (state.timerType === "POMODORO") {
    const runningMs =
      state.runStatus === "running" && state.runningSinceMs != null
        ? Math.max(0, nowMs - state.runningSinceMs)
        : 0;
    return state.phaseAccumulatedMs + runningMs;
  }
  return studyMsSoFar(state, nowMs);
}

export function breakRemainingMs(state: PomodoroState, nowMs: number): number {
  const target = state.phase === "shortBreak" ? state.shortBreakMs : state.longBreakMs;
  return Math.max(0, target - currentPhaseElapsedMs(state, nowMs));
}

export function pomodoroWorkRemainingMs(state: PomodoroState, nowMs: number): number {
  return Math.max(0, state.workMs - currentPhaseElapsedMs(state, nowMs));
}

export function countdownRemainingMs(state: CountdownState, nowMs: number): number {
  return Math.max(0, state.targetMs - studyMsSoFar(state, nowMs));
}

/** 3-3-1-1節: 「計測中(作業中を含む)」かどうか。ハートビート送信・無操作監視の対象判定に使う。 */
export function isMeasuring(state: EngineState): boolean {
  if (state.endingPhase !== "active") return false;
  if (state.dialog.shown) return false;
  if (state.timerType === "POMODORO") {
    return state.phase === "work" && state.runStatus === "running";
  }
  return state.runStatus === "running";
}

// 戻り値をEngineState(共用体)に留めているのは、ジェネリクス経由だと判別プロパティによる
// 絞り込みがTS上うまく伝播しないため。呼び出し側で必要な具象型へ明示キャストする
// (timerTypeは変えないので安全)。
function freezeRunning(state: EngineState, nowMs: number): EngineState {
  if (state.runningSinceMs == null) return state;
  const elapsed = Math.max(0, nowMs - state.runningSinceMs);
  if (state.timerType === "POMODORO") {
    return {
      ...state,
      phaseAccumulatedMs: state.phaseAccumulatedMs + elapsed,
      runningSinceMs: null,
    };
  }
  return {
    ...state,
    accumulatedMs: state.accumulatedMs + elapsed,
    runningSinceMs: null,
  };
}

function beginFinalize(
  state: EngineState,
  reason: ManualEndReason,
  durationMs: number,
): EngineState {
  return {
    ...state,
    endingPhase: "finalizing",
    pendingEndReason: reason,
    pendingDurationMs: Math.max(0, durationMs),
  };
}

function advanceFromWork(state: PomodoroState, nowMs: number): PomodoroState {
  const frozen = freezeRunning(state, nowMs) as PomodoroState;
  const confirmedWorkMs = frozen.confirmedWorkMs + frozen.workMs;
  const setsCompleted = frozen.setsCompleted + 1;
  const isLongBreakNext = frozen.setNumber >= frozen.setsUntilLong;

  return {
    ...frozen,
    confirmedWorkMs,
    setsCompleted,
    phase: isLongBreakNext ? "longBreak" : "shortBreak",
    phaseAccumulatedMs: 0,
    runStatus: "running",
    runningSinceMs: nowMs,
  };
}

function advanceFromBreak(
  state: PomodoroState,
  nowMs: number,
  wasSkipped: boolean,
): PomodoroState {
  const frozen = freezeRunning(state, nowMs) as PomodoroState;
  const wasLongBreak = frozen.phase === "longBreak";

  return {
    ...frozen,
    phase: "work",
    phaseAccumulatedMs: 0,
    runStatus: "running",
    runningSinceMs: nowMs,
    setNumber: wasLongBreak ? 1 : frozen.setNumber + 1,
    breaksSkipped: frozen.breaksSkipped + (wasSkipped ? 1 : 0),
  };
}

function freezeForDialog(state: EngineState, nowMs: number): EngineState {
  const frozen = freezeRunning(state, nowMs);
  return { ...frozen, dialog: { shown: true, shownAtMs: nowMs } };
}

function tick(state: EngineState, nowMs: number): EngineState {
  if (state.endingPhase !== "active") return state;

  // 3-3-1-6節: ダイアログ表示中は時間を増やさず、猶予5分の経過だけを見る。
  if (state.dialog.shown) {
    if (nowMs - state.dialog.shownAtMs >= INACTIVITY_GRACE_MS) {
      return beginFinalize(state, "INACTIVITY_AUTO", studyMsSoFar(state, nowMs));
    }
    return state;
  }

  let next: EngineState = state;

  if (next.timerType === "COUNTDOWN") {
    if (studyMsSoFar(next, nowMs) >= next.targetMs) {
      // 3-2-2節: 満了時は設定時間の全体を記録する。
      return beginFinalize(next, "COMPLETED", next.targetMs);
    }
  }

  if (next.timerType === "POMODORO") {
    if (next.phase === "work") {
      if (
        next.runStatus === "running" &&
        next.runningSinceMs != null &&
        next.phaseAccumulatedMs + (nowMs - next.runningSinceMs) >= next.workMs
      ) {
        next = advanceFromWork(next, nowMs);
      }
    } else if (currentPhaseElapsedMs(next, nowMs) >= (next.phase === "shortBreak" ? next.shortBreakMs : next.longBreakMs)) {
      next = advanceFromBreak(next, nowMs, false);
    }
  }

  // 3-3-1-2, 3-3-1-7節: 「計測中」の間だけ無操作監視を進める。
  if (next.endingPhase === "active" && !next.dialog.shown && isMeasuring(next)) {
    const elapsedSinceCheckpoint = studyMsSoFar(next, nowMs) - next.inactivityCheckpointMs;
    if (elapsedSinceCheckpoint >= INACTIVITY_THRESHOLD_MS) {
      next = freezeForDialog(next, nowMs);
    }
  }

  return next;
}

function pauseAction(state: EngineState, nowMs: number): EngineState {
  if (state.endingPhase !== "active" || state.dialog.shown) return state;
  if (state.timerType === "POMODORO" && state.phase !== "work") return state;
  if (state.runStatus !== "running") return state;
  return { ...freezeRunning(state, nowMs), runStatus: "paused" };
}

function resumeAction(state: EngineState, nowMs: number): EngineState {
  if (state.endingPhase !== "active" || state.dialog.shown) return state;
  if (state.runStatus !== "paused") return state;
  return { ...state, runStatus: "running", runningSinceMs: nowMs };
}

function skipBreakAction(state: EngineState, nowMs: number): EngineState {
  if (state.timerType !== "POMODORO") return state;
  if (state.endingPhase !== "active" || state.dialog.shown) return state;
  if (state.phase === "work") return state;
  return advanceFromBreak(state, nowMs, true);
}

function dialogContinueAction(state: EngineState, nowMs: number): EngineState {
  if (!state.dialog.shown) return state;
  const resumed = { ...state, runStatus: "running" as const, runningSinceMs: nowMs, dialog: { shown: false as const } };
  return { ...resumed, inactivityCheckpointMs: studyMsSoFar(resumed, nowMs) };
}

function requestEndAction(state: EngineState, nowMs: number): EngineState {
  if (state.endingPhase !== "active") return state;
  return beginFinalize(state, "MANUAL", studyMsSoFar(state, nowMs));
}

export function timerEngineReducer(state: EngineState, action: EngineAction): EngineState {
  switch (action.type) {
    case "TICK":
      return tick(state, action.nowMs);
    case "PAUSE":
      return pauseAction(state, action.nowMs);
    case "RESUME":
      return resumeAction(state, action.nowMs);
    case "SKIP_BREAK":
      return skipBreakAction(state, action.nowMs);
    case "DIALOG_CONTINUE":
      return dialogContinueAction(state, action.nowMs);
    case "REQUEST_END":
      return requestEndAction(state, action.nowMs);
    case "FINALIZE_DONE":
      return { ...state, endingPhase: "done" };
    case "RESTORE":
      return action.state.timerType === state.timerType &&
        action.state.sessionId === state.sessionId
        ? action.state
        : state;
    default:
      return state;
  }
}
