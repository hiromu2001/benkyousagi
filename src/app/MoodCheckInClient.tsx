"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import Rabbit from "@/components/rabbit/Rabbit";
import { Carrot } from "@/components/rabbit/Carrot";
import { submitMoodAction } from "@/lib/mood-actions";
import { MOOD_CONFIG, MOOD_LEVELS_DESC, MOOD_REPLIES, type MoodLevel } from "@/lib/mood";

// 「きょうのきぶん」チェックイン + うさぎ本体の表示。
// うさぎを含めてクライアント側に持つのは、回答した瞬間に celebrate(ジャンプ+ハート)を
// 発火させるため。表示テキスト(段階ラベル等)はサーバー側で計算して props で受け取る。

type Phase = "ask" | "eating" | "answered";

type Props = {
  energy: number;
  rabbitName: string;
  ribbonColor: "PINK" | "LAVENDER" | "MINT" | "CREAM";
  equippedItem: string | null;
  stageLabel: string;
  stageMessage: string;
  initialMoodLevel: MoodLevel | null;
};

export default function MoodCheckInClient({
  energy,
  rabbitName,
  ribbonColor,
  equippedItem,
  stageLabel,
  stageMessage,
  initialMoodLevel,
}: Props) {
  const [phase, setPhase] = useState<Phase>(initialMoodLevel !== null ? "answered" : "ask");
  const [mood, setMood] = useState<MoodLevel | null>(initialMoodLevel);
  const [justAnswered, setJustAnswered] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const timersRef = useRef<number[]>([]);
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  function pick(level: MoodLevel) {
    if (isPending || phase !== "ask") return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await submitMoodAction(level);
        if (result.status === "error") {
          setError(result.message);
          return;
        }
        setMood(result.level);
        if (result.status === "already") {
          // 別タブ等で回答済みだった場合。上書きせず、そのまま回答済み表示に切り替える。
          setNotice(result.message);
          setPhase("answered");
          return;
        }
        // 回答成功: にんじんを食べる → ジャンプ+ハート → ひとこと、の順で見せる。
        setJustAnswered(true);
        setEarnedCoins(result.earnedCoins);
        setPhase("eating");
        timersRef.current.push(window.setTimeout(() => setCelebrating(true), 900));
        timersRef.current.push(window.setTimeout(() => setPhase("answered"), 1600));
      } catch {
        // submitMoodAction自体が(通信断等で)例外を投げた場合の保険。
        setError("うまく とどかなかったみたい…もういちど ためしてね");
      }
    });
  }

  return (
    <>
      <div className="flex flex-col items-center gap-1">
        <div className="relative">
          <Rabbit
            energy={energy}
            name={rabbitName}
            ribbonColor={ribbonColor}
            equippedItem={equippedItem}
            size="md"
            celebrate={celebrating}
          />
          <AnimatePresence>
            {phase === "eating" && (
              <motion.div
                key="carrot"
                className="pointer-events-none absolute bottom-[24%] right-[4%] h-10 w-10"
                initial={{ opacity: 0, scale: 0.3, y: 16, rotate: -10 }}
                animate={{
                  opacity: [0, 1, 1, 1, 1, 0],
                  scale: [0.3, 1.05, 0.85, 0.65, 0.4, 0.15],
                  rotate: [-10, 8, -6, 6, -4, 0],
                  y: [16, 0, 2, 4, 6, 8],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.3, times: [0, 0.25, 0.45, 0.65, 0.85, 1], ease: "easeOut" }}
              >
                <Carrot className="h-full w-full" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <h1 className="mt-1 text-xl font-bold text-charcoal">{rabbitName}</h1>
        <span className="rounded-full bg-pink/60 px-3 py-1 text-xs font-bold text-charcoal-soft">
          いま: {stageLabel}
        </span>
      </div>

      <p className="max-w-xs text-sm leading-relaxed text-charcoal-soft">{stageMessage}</p>

      {/* min-hで最も背の高い"ask"状態ぶんの高さを確保し、"answered"に切り替わった時に
          下のボタン群がガクッと詰まって見えるのを防ぐ(高さの近似値。厳密な計測はしていない)。 */}
      <div className="flex w-full min-h-[150px] flex-col items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {phase === "ask" && (
            <motion.section
              key="ask"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full rounded-2xl border border-pink-deep/20 bg-milk p-3 shadow-sm"
              aria-label="きょうのきぶんチェックイン"
            >
              <p className="text-sm font-bold text-charcoal">きょうの きぶんは どう？</p>
              <p className="mt-1 text-[11px] text-charcoal-soft">
                こたえると {rabbitName} に にんじんを あげられるよ
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {MOOD_LEVELS_DESC.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => pick(level)}
                    disabled={isPending}
                    className={clsx(
                      "rounded-2xl px-3 py-2.5 text-sm font-bold text-charcoal shadow-sm transition-transform active:scale-95 disabled:opacity-60 sm:hover:scale-[1.03]",
                      MOOD_CONFIG[level].pickerClass,
                    )}
                  >
                    <span className="mr-1" aria-hidden>
                      {MOOD_CONFIG[level].emoji}
                    </span>
                    {MOOD_CONFIG[level].label}
                  </button>
                ))}
              </div>
              <p
                role="alert"
                className={clsx(
                  "mt-2 min-h-5 text-xs text-charcoal transition-opacity",
                  error ? "opacity-100" : "opacity-0",
                )}
              >
                {error}
              </p>
            </motion.section>
          )}

          {phase === "eating" && (
            <motion.p
              key="eating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-bold text-charcoal"
            >
              もぐもぐ……
            </motion.p>
          )}

          {phase === "answered" && mood !== null && (
            <motion.section
              key="answered"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex w-full flex-col items-center gap-2"
            >
              <span className="rounded-full bg-milk px-4 py-1.5 text-xs font-bold text-charcoal shadow-sm ring-1 ring-pink-deep/20">
                きょうのきぶん{" "}
                <span aria-hidden>{MOOD_CONFIG[mood].emoji}</span> {MOOD_CONFIG[mood].label}
              </span>
              {justAnswered && earnedCoins > 0 && (
                <span className="rounded-full bg-apricot/40 px-3 py-1 text-[11px] font-bold text-charcoal">
                  +{earnedCoins} コイン
                </span>
              )}
              <p className="text-xs leading-relaxed text-charcoal-soft">
                {notice ?? (justAnswered ? MOOD_REPLIES[mood] : "また あした も きかせてね")}
              </p>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
