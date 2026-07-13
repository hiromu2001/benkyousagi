"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import type { RibbonColor } from "@/generated/prisma";
import { completeOnboardingAction } from "@/lib/onboarding-actions";
import { RIBBON_COLOR_HEX, RIBBON_COLOR_LABELS } from "@/lib/theme";
import Rabbit from "@/components/rabbit/Rabbit";
import { WorldExplainer } from "./WorldExplainer";

const NAME_MAX_LENGTH = 10;
const PREVIEW_ENERGY = 82;

const STEP_TRANSITION = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

export function OnboardingClient({
  initialName,
  initialRibbonColor,
}: {
  initialName: string;
  initialRibbonColor: RibbonColor;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [ribbonColor, setRibbonColor] = useState<RibbonColor>(initialRibbonColor);
  const [isPending, startTransition] = useTransition();

  const previewName = name.trim() || initialName || "おもち";

  function handleSubmit() {
    if (isPending) return;
    startTransition(async () => {
      await completeOnboardingAction(name, ribbonColor);
    });
  }

  return (
    <div className="flex w-full flex-1 flex-col">
      <div className="mb-6 flex justify-center gap-2">
        {[1, 2].map((s) => (
          <span
            key={s}
            className={clsx(
              "h-1.5 w-7 rounded-full transition-colors",
              s === step ? "bg-pink-deep" : "bg-charcoal/15",
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="step1" {...STEP_TRANSITION} className="flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-charcoal">べんきょうさぎへ、ようこそ</h1>
              <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
                このうさぎは、あなたが べんきょうした ぶんだけ、いっしょに きぶんよく くらしていくよ。
              </p>
            </div>

            <WorldExplainer />

            <div className="rounded-3xl bg-lavender/25 px-5 py-4 text-center">
              <p className="text-sm font-bold leading-relaxed text-charcoal">
                がんばりすぎなくても、だいじょうぶ。
                <br />
                もどってきたら、いつでも よろこんでくれるよ。
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-2 w-full rounded-full bg-apricot px-8 py-4 text-lg font-bold text-charcoal shadow-md transition-transform active:scale-95 sm:hover:scale-[1.02]"
            >
              つぎへ
            </button>
          </motion.div>
        ) : (
          <motion.div key="step2" {...STEP_TRANSITION} className="flex flex-col gap-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={isPending}
              className="self-start text-sm text-charcoal-soft transition-colors hover:text-charcoal disabled:opacity-40"
            >
              ← もどる
            </button>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-charcoal">なまえと リボンを きめよう</h1>
              <p className="mt-2 text-sm text-charcoal-soft">すきな なまえと いろに してあげてね</p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Rabbit energy={PREVIEW_ENERGY} name={previewName} ribbonColor={ribbonColor} size="md" />
              <p className="text-lg font-bold text-charcoal">{previewName}</p>
            </div>

            <div>
              <label htmlFor="rabbit-name" className="mb-2 block text-sm font-bold text-charcoal-soft">
                なまえ(10もじまで)
              </label>
              <input
                id="rabbit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="おもち"
                maxLength={NAME_MAX_LENGTH}
                className="w-full rounded-xl bg-milk px-4 py-3 text-lg font-bold text-charcoal shadow-sm outline-none ring-pink-deep focus:ring-2"
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-bold text-charcoal-soft">リボンのいろ</p>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(RIBBON_COLOR_HEX) as RibbonColor[]).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setRibbonColor(color)}
                    className={clsx(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm transition active:scale-95",
                      ribbonColor === color
                        ? "bg-pink-deep text-charcoal"
                        : "bg-milk text-charcoal-soft hover:bg-pink/40",
                    )}
                  >
                    <span
                      aria-hidden
                      className="h-6 w-6 rounded-full border-2 border-charcoal/20"
                      style={{ backgroundColor: RIBBON_COLOR_HEX[color] }}
                    />
                    <span className="font-bold">{RIBBON_COLOR_LABELS[color]}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="mt-2 w-full rounded-full bg-apricot px-8 py-4 text-lg font-bold text-charcoal shadow-md transition-transform active:scale-95 disabled:opacity-50 sm:hover:scale-[1.02]"
            >
              {isPending ? "じゅんびちゅう..." : "はじめる"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
