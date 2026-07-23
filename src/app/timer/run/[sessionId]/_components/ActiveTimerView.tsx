"use client";

import { useState } from "react";
import type { RibbonColor } from "@/generated/prisma";
import Rabbit from "@/components/rabbit/Rabbit";
import {
  breakRemainingMs,
  countdownRemainingMs,
  isMeasuring,
  pomodoroWorkRemainingMs,
  studyMsSoFar,
  type EngineState,
} from "../_lib/engine";
import { formatClock } from "../_lib/format";

type Props = {
  state: EngineState;
  nowMs: number;
  rabbitName: string;
  ribbonColor: RibbonColor;
  equippedItem: string | null;
  equippedOutfit: string | null;
  energy: number;
  celebrate: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onEnd: () => void;
};

const PHASE_LABEL: Record<string, string> = {
  work: "さぎょう中",
  shortBreak: "きゅうけい中(小)",
  longBreak: "きゅうけい中(長)",
};

const TIMER_TYPE_LABEL: Record<EngineState["timerType"], string> = {
  COUNTUP: "カウントアップ",
  COUNTDOWN: "カウントダウン",
  POMODORO: "ポモドーロ",
};

export default function ActiveTimerView({
  state,
  nowMs,
  rabbitName,
  ribbonColor,
  equippedItem,
  equippedOutfit,
  energy,
  celebrate,
  onPause,
  onResume,
  onSkip,
  onEnd,
}: Props) {
  const [confirmingEnd, setConfirmingEnd] = useState(false);

  const isPomodoro = state.timerType === "POMODORO";
  const isOnBreak = isPomodoro && state.phase !== "work";
  const isPaused = state.runStatus === "paused" && !isOnBreak;
  const measuring = isMeasuring(state);

  let mainLabel = "";
  let mainMs = 0;
  if (state.timerType === "COUNTUP") {
    mainLabel = isPaused ? "いちじ停止中" : "けいそく中";
    mainMs = studyMsSoFar(state, nowMs);
  } else if (state.timerType === "COUNTDOWN") {
    mainLabel = isPaused ? "いちじ停止中" : "のこり時間";
    mainMs = countdownRemainingMs(state, nowMs);
  } else if (state.phase === "work") {
    mainLabel = isPaused ? "いちじ停止中" : "のこり(さぎょう)";
    mainMs = pomodoroWorkRemainingMs(state, nowMs);
  } else {
    mainLabel = "のこり(きゅうけい)";
    mainMs = breakRemainingMs(state, nowMs);
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center gap-6 px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-charcoal-soft">
        <span className="rounded-full bg-pink px-3 py-1 font-bold text-charcoal">
          {TIMER_TYPE_LABEL[state.timerType]}
        </span>
        {isPomodoro && (
          <span className="rounded-full bg-lavender px-3 py-1 font-bold text-charcoal">
            {PHASE_LABEL[state.phase]} ・ {state.setNumber}/{state.setsUntilLong}セット目
          </span>
        )}
      </div>

      <Rabbit
        energy={energy}
        name={rabbitName}
        ribbonColor={ribbonColor}
        equippedItem={equippedItem}
        equippedOutfit={equippedOutfit}
        size="lg"
        celebrate={celebrate}
      />

      <div className="text-center">
        <p className="text-sm text-charcoal-soft">{mainLabel}</p>
        <p className="font-mono text-6xl font-bold tabular-nums text-charcoal">
          {formatClock(mainMs)}
        </p>
        {isPomodoro && (
          <p className="mt-1 text-xs text-charcoal-soft">
            ここまでの勉強時間 {formatClock(studyMsSoFar(state, nowMs))}
          </p>
        )}
      </div>

      {!measuring && !isOnBreak && state.endingPhase === "active" && (
        <p className="text-xs text-charcoal-soft">いちじ停止中は時間をカウントしていません</p>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        {isOnBreak ? (
          <button
            type="button"
            onClick={onSkip}
            className="rounded-full bg-mint px-6 py-3 font-bold text-charcoal shadow-sm transition active:scale-95"
          >
            スキップして次のさぎょうへ
          </button>
        ) : isPaused ? (
          <button
            type="button"
            onClick={onResume}
            className="rounded-full bg-pink-deep px-6 py-3 font-bold text-charcoal shadow-sm transition active:scale-95"
          >
            さいかい
          </button>
        ) : (
          <button
            type="button"
            onClick={onPause}
            className="rounded-full bg-lavender px-6 py-3 font-bold text-charcoal shadow-sm transition active:scale-95"
          >
            いちじ停止
          </button>
        )}

        {confirmingEnd ? (
          <div className="flex items-center gap-2 rounded-full bg-milk px-3 py-2 shadow-sm">
            <span className="text-sm text-charcoal-soft">おわる?</span>
            <button
              type="button"
              onClick={onEnd}
              className="rounded-full bg-apricot px-4 py-2 text-sm font-bold text-charcoal active:scale-95"
            >
              おわる
            </button>
            <button
              type="button"
              onClick={() => setConfirmingEnd(false)}
              className="rounded-full px-4 py-2 text-sm text-charcoal-soft active:scale-95"
            >
              もどる
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingEnd(true)}
            className="rounded-full bg-transparent px-6 py-3 font-bold text-charcoal-soft underline-offset-4 transition hover:underline active:scale-95"
          >
            終了する
          </button>
        )}
      </div>
    </div>
  );
}
