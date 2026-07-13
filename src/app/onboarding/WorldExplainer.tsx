"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import Rabbit from "@/components/rabbit/Rabbit";
import { energyStage, ENERGY_STAGE_LABELS } from "@/lib/rabbit-status";

type Phase = {
  energy: number;
  celebrate: boolean;
  caption: string;
};

function stageLabel(energy: number): string {
  return ENERGY_STAGE_LABELS[energyStage(energy)];
}

// 各段階のエネルギー値からラベルを実際の energyStage() で算出し、閾値変更時の表記ズレを防ぐ。
const PHASES: Phase[] = [
  {
    energy: 96,
    celebrate: false,
    caption: "べんきょうすると「げんき」があがって、ひょうじょうが かわっていくよ",
  },
  {
    energy: 65,
    celebrate: false,
    caption: `げんきは ぜんぶで6だんかい。いまは「${stageLabel(65)}」くらい`,
  },
  {
    energy: 22,
    celebrate: false,
    caption: `べんきょうしない じかんが つづくと…「${stageLabel(22)}」と しちゃうよ`,
  },
  {
    energy: 0,
    celebrate: false,
    caption: "げんきが 0に なっても、しんだり きえたり しないよ",
  },
  {
    energy: 0,
    celebrate: false,
    caption: "ちいさな ふとんに くるまって「まってるよ…」って まってるだけ",
  },
  {
    energy: 94,
    celebrate: true,
    caption: "タイマーを おすと「おかえり!」って、げんきいっぱいに なるよ",
  },
];

const PHASE_DURATION_MS = 2800;

export function WorldExplainer() {
  const [index, setIndex] = useState(0);
  const [autoKey, setAutoKey] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % PHASES.length);
    }, PHASE_DURATION_MS);
    return () => clearInterval(timer);
  }, [autoKey]);

  function goTo(next: number) {
    setIndex((next + PHASES.length) % PHASES.length);
    setAutoKey((k) => k + 1);
  }

  const phase = PHASES[index];

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-pink/30 px-5 py-6">
      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Rabbit energy={phase.energy} name="おもち" ribbonColor="PINK" size="md" celebrate={phase.celebrate} />
      </motion.div>

      <div className="flex min-h-20 w-full items-center justify-center px-2">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-center text-sm leading-relaxed text-charcoal"
          >
            {phase.caption}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="まえの せつめいへ"
          onClick={() => goTo(index - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-milk text-lg text-charcoal-soft shadow-sm transition active:scale-90 hover:bg-pink/40"
        >
          ‹
        </button>

        <div className="flex gap-1.5">
          {PHASES.map((_, i) => (
            <span
              key={i}
              className={clsx(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i === index ? "bg-pink-deep" : "bg-charcoal/15",
              )}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="つぎの せつめいへ"
          onClick={() => goTo(index + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-milk text-lg text-charcoal-soft shadow-sm transition active:scale-90 hover:bg-pink/40"
        >
          ›
        </button>
      </div>
    </div>
  );
}
