"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { RibbonColor } from "@/generated/prisma";
import {
  endSessionAction,
  heartbeatAction,
  updatePomodoroProgressAction,
} from "@/lib/timer-actions";
import {
  clampEnergy,
  energyAfterSessionStart,
  energyGainForDuration,
} from "@/lib/rabbit-status";
import { HEARTBEAT_INTERVAL_MS } from "@/lib/timer-config";
import { COIN_PER_MINUTE, COIN_COMPLETION_BONUS } from "@/lib/shop";
import {
  buildInitialState,
  isMeasuring,
  studyMsSoFar,
  timerEngineReducer,
  type EngineState,
} from "../_lib/engine";
import { clearEngineState, loadEngineState, saveEngineState } from "../_lib/storage";
import ActiveTimerView from "./ActiveTimerView";
import CompletionView from "./CompletionView";
import InactivityDialog from "./InactivityDialog";

export type RunConfig =
  | { timerType: "COUNTUP" }
  | { timerType: "COUNTDOWN"; targetSeconds: number }
  | {
      timerType: "POMODORO";
      work: number;
      shortBreak: number;
      long: number;
      setsUntilLong: number;
    };

type Props = {
  sessionId: string;
  startedAtMs: number;
  config: RunConfig;
  rabbitName: string;
  ribbonColor: RibbonColor;
  equippedItem: string | null;
  baselineEnergy: number;
};

function initEngineState(sessionId: string, startedAtMs: number, config: RunConfig): EngineState {
  if (config.timerType === "COUNTUP") {
    return buildInitialState(sessionId, "COUNTUP", startedAtMs, null);
  }
  if (config.timerType === "COUNTDOWN") {
    return buildInitialState(sessionId, "COUNTDOWN", startedAtMs, {
      targetSeconds: config.targetSeconds,
    });
  }
  return buildInitialState(sessionId, "POMODORO", startedAtMs, {
    work: config.work,
    shortBreak: config.shortBreak,
    long: config.long,
    setsUntilLong: config.setsUntilLong,
  });
}

export default function TimerRunClient({
  sessionId,
  startedAtMs,
  config,
  rabbitName,
  ribbonColor,
  equippedItem,
  baselineEnergy,
}: Props) {
  const [engineState, dispatch] = useReducer(
    timerEngineReducer,
    { sessionId, startedAtMs, config },
    ({ sessionId, startedAtMs, config }) => initEngineState(sessionId, startedAtMs, config),
  );
  // SSR/初回クライアント描画のハイドレーション不一致を避けるため、
  // 「今」の基準値はサーバーと同じ startedAtMs から始め、マウント後のeffectで実時刻へ進める。
  const [nowMs, setNowMs] = useState(startedAtMs);
  const [celebrate, setCelebrate] = useState(false);

  const engineStateRef = useRef(engineState);
  useEffect(() => {
    engineStateRef.current = engineState;
  }, [engineState]);

  const lastHeartbeatSentAtRef = useRef(startedAtMs);

  // 初回マウント時: localStorageに保存済みの状態があれば復元、なければ新規開始として「おかえり」演出。
  // setState呼び出しをrequestAnimationFrameのコールバック内に置くことで、
  // 「effect本体で直接setStateする」形を避けている(react-hooks/set-state-in-effect対策)。
  useEffect(() => {
    let celebrateTimer: ReturnType<typeof setTimeout> | undefined;

    const raf = requestAnimationFrame(() => {
      const saved = loadEngineState(sessionId);
      if (saved) {
        dispatch({ type: "RESTORE", state: saved });
        setNowMs(Date.now());
        return;
      }
      setCelebrate(true);
      setNowMs(Date.now());
      celebrateTimer = setTimeout(() => setCelebrate(false), 2600);
    });

    return () => {
      cancelAnimationFrame(raf);
      if (celebrateTimer) clearTimeout(celebrateTimer);
    };
  }, [sessionId]);

  // 毎秒のtick: 表示更新・状態遷移判定・ハートビート送信をまとめて行う。
  useEffect(() => {
    const interval = setInterval(() => {
      const nowMs = Date.now();
      setNowMs(nowMs);
      dispatch({ type: "TICK", nowMs });

      const current = engineStateRef.current;
      if (
        isMeasuring(current) &&
        nowMs - lastHeartbeatSentAtRef.current >= HEARTBEAT_INTERVAL_MS
      ) {
        lastHeartbeatSentAtRef.current = nowMs;
        const seconds = Math.floor(studyMsSoFar(current, nowMs) / 1000);
        heartbeatAction(sessionId, seconds).catch(() => {});
      }
    }, 1000);

    // 3-3-1-3節: 経過時間ベースの判定を、バックグラウンドタブでのタイマー間引き後も
    // なるべく早く反映するための補助(判定条件自体はタブの可視性を見ていない)。
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const nowMs = Date.now();
      setNowMs(nowMs);
      dispatch({ type: "TICK", nowMs });
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [sessionId]);

  // 状態が変わるたびに永続化(リロード/再訪時の復元用。REQUIREMENTS.md 4章)。
  useEffect(() => {
    if (engineState.endingPhase === "done") {
      clearEngineState(sessionId);
      return;
    }
    saveEngineState(engineState);
  }, [engineState, sessionId]);

  // ポモドーロの進捗(完了セット数・休憩スキップ回数)は変化の都度サーバーへ同期しておく
  // (異常終了救済で拾われた場合でも、直前までの進捗が失われないように)。
  const setsCompleted = engineState.timerType === "POMODORO" ? engineState.setsCompleted : null;
  const breaksSkipped = engineState.timerType === "POMODORO" ? engineState.breaksSkipped : null;
  useEffect(() => {
    if (setsCompleted == null || breaksSkipped == null) return;
    updatePomodoroProgressAction(sessionId, setsCompleted, breaksSkipped).catch(() => {});
  }, [sessionId, setsCompleted, breaksSkipped]);

  // 終了処理: endingPhaseが"finalizing"になったらサーバーへ確定を依頼する。
  // 記録の確定は不正防止の要なので、一時的な通信エラーでは諦めず数回リトライする。
  // それでも失敗した場合は異常終了救済(recoverStaleSessionsAction)が最終的なセーフティネットになる。
  useEffect(() => {
    if (engineState.endingPhase !== "finalizing") return;
    let cancelled = false;
    const seconds = Math.max(0, Math.round((engineState.pendingDurationMs ?? 0) / 1000));
    const reason = engineState.pendingEndReason ?? "MANUAL";

    (async () => {
      const maxAttempts = 3;
      for (let attempt = 0; attempt < maxAttempts && !cancelled; attempt++) {
        try {
          await endSessionAction(sessionId, seconds, reason);
          break;
        } catch {
          if (attempt < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
      }
      if (!cancelled) dispatch({ type: "FINALIZE_DONE" });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    sessionId,
    engineState.endingPhase,
    engineState.pendingDurationMs,
    engineState.pendingEndReason,
  ]);

  // 終了確定後は記録時間が固定されるため、元気度計算も確定値(pendingDurationMs)基準に固定する。
  const liveStudySeconds =
    engineState.endingPhase === "active"
      ? Math.floor(studyMsSoFar(engineState, nowMs) / 1000)
      : Math.round((engineState.pendingDurationMs ?? 0) / 1000);
  const optimisticEnergy = clampEnergy(
    energyAfterSessionStart(baselineEnergy) + energyGainForDuration(liveStudySeconds),
  );

  // 楽観的UI: サーバーでの確定(endSessionAction)を待たずに、終了操作の瞬間から完了画面を出す。
  // 記録時間・元気度・コインはクライアント側で同じ計算式(session-finalize.tsと揃えている)により
  // 算出済みなので表示に不足はなく、DB確定は裏で進む(失敗しても上のリトライ+異常終了救済がセーフティネット)。
  if (engineState.endingPhase === "finalizing" || engineState.endingPhase === "done") {
    const reason = engineState.pendingEndReason ?? "MANUAL";
    const optimisticCoins =
      Math.floor(liveStudySeconds / 60) * COIN_PER_MINUTE +
      (reason === "COMPLETED" ? COIN_COMPLETION_BONUS : 0);
    return (
      <CompletionView
        reason={reason}
        durationMs={engineState.pendingDurationMs ?? 0}
        rabbitName={rabbitName}
        ribbonColor={ribbonColor}
        equippedItem={equippedItem}
        energy={optimisticEnergy}
        earnedCoins={optimisticCoins}
      />
    );
  }

  return (
    <>
      <ActiveTimerView
        state={engineState}
        nowMs={nowMs}
        rabbitName={rabbitName}
        ribbonColor={ribbonColor}
        equippedItem={equippedItem}
        energy={optimisticEnergy}
        celebrate={celebrate}
        onPause={() => dispatch({ type: "PAUSE", nowMs: Date.now() })}
        onResume={() => dispatch({ type: "RESUME", nowMs: Date.now() })}
        onSkip={() => dispatch({ type: "SKIP_BREAK", nowMs: Date.now() })}
        onEnd={() => dispatch({ type: "REQUEST_END", nowMs: Date.now() })}
      />
      {engineState.dialog.shown && (
        <InactivityDialog
          rabbitName={rabbitName}
          ribbonColor={ribbonColor}
          equippedItem={equippedItem}
          energy={optimisticEnergy}
          onContinue={() => dispatch({ type: "DIALOG_CONTINUE", nowMs: Date.now() })}
          onEnd={() => dispatch({ type: "REQUEST_END", nowMs: Date.now() })}
        />
      )}
    </>
  );
}
