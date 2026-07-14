'use client';

import { useState, useTransition } from "react";
import clsx from "clsx";
import type { RibbonColor } from "@/generated/prisma";
import { updateNamesAction } from "@/lib/auth-actions";
import { RIBBON_COLOR_HEX, RIBBON_COLOR_LABELS } from "@/lib/theme";
import Rabbit from "@/components/rabbit/Rabbit";

// onboarding/OnboardingClient.tsx の NAME_MAX_LENGTH と揃えている。
const NAME_MAX_LENGTH = 10;

export function NameEditClient({
  initialRabbitName,
  initialDisplayName,
  initialRibbonColor,
  energy,
  equippedItem,
}: {
  initialRabbitName: string;
  initialDisplayName: string;
  initialRibbonColor: RibbonColor;
  energy: number;
  equippedItem: string | null;
}) {
  const [rabbitName, setRabbitName] = useState(initialRabbitName);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [ribbonColor, setRibbonColor] = useState<RibbonColor>(initialRibbonColor);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canSubmit = !isPending && rabbitName.trim().length > 0 && displayName.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateNamesAction(rabbitName, displayName, ribbonColor);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-bold text-charcoal">なまえの へんこう</h2>

      <div className="flex flex-col items-center gap-1">
        <Rabbit
          energy={energy}
          name={rabbitName || "(なまえを いれてね)"}
          ribbonColor={ribbonColor}
          equippedItem={equippedItem}
          size="md"
        />
      </div>

      <div>
        <label htmlFor="settings-rabbit-name" className="mb-2 block text-sm font-bold text-charcoal-soft">
          うさぎの なまえ(10もじまで)
        </label>
        <input
          id="settings-rabbit-name"
          type="text"
          value={rabbitName}
          onChange={(e) => {
            setRabbitName(e.target.value);
            setSaved(false);
          }}
          maxLength={NAME_MAX_LENGTH}
          className="w-full rounded-xl bg-milk px-4 py-3 text-lg font-bold text-charcoal shadow-sm outline-none ring-pink-deep focus:ring-2"
        />
      </div>

      <div>
        <label htmlFor="settings-display-name" className="mb-2 block text-sm font-bold text-charcoal-soft">
          あなたの なまえ(10もじまで)
        </label>
        <input
          id="settings-display-name"
          type="text"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            setSaved(false);
          }}
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
              onClick={() => {
                setRibbonColor(color);
                setSaved(false);
              }}
              className={clsx(
                "flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm transition active:scale-95",
                ribbonColor === color ? "bg-pink-deep text-charcoal" : "bg-milk text-charcoal-soft hover:bg-pink/40",
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

      <div
        role="alert"
        className={clsx(
          "min-h-11 w-full rounded-2xl px-4 py-2 text-center text-sm text-charcoal transition-opacity",
          error ? "bg-pink/70 shadow-sm opacity-100" : saved ? "bg-mint/50 shadow-sm opacity-100" : "opacity-0",
        )}
      >
        {error ?? (saved ? "ほぞんしたよ！" : "")}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full rounded-full bg-apricot px-8 py-3 text-lg font-bold text-charcoal shadow-md transition-transform active:scale-95 disabled:opacity-40 sm:hover:scale-[1.02]"
      >
        ほぞんする
      </button>
    </div>
  );
}
