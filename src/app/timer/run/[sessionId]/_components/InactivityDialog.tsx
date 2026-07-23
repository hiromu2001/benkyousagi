"use client";

import { motion } from "framer-motion";
import Rabbit from "@/components/rabbit/Rabbit";
import type { RibbonColor } from "@/generated/prisma";

type Props = {
  rabbitName: string;
  ribbonColor: RibbonColor;
  equippedItem: string | null;
  equippedOutfit: string | null;
  energy: number;
  onContinue: () => void;
  onEnd: () => void;
};

// REQUIREMENTS.md 3-3-1-4節: 「まだ勉強してる?」確認ダイアログ。うさぎが小首を傾げる演出付き。
export default function InactivityDialog({
  rabbitName,
  ribbonColor,
  equippedItem,
  equippedOutfit,
  energy,
  onContinue,
  onEnd,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="w-full max-w-sm rounded-3xl bg-milk px-6 py-8 text-center shadow-xl"
      >
        <motion.div
          animate={{ rotate: [0, -8, 0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.6 }}
          className="mx-auto w-fit"
        >
          <Rabbit
            energy={energy}
            name={rabbitName}
            ribbonColor={ribbonColor}
            equippedItem={equippedItem}
            equippedOutfit={equippedOutfit}
            size="md"
          />
        </motion.div>

        <p className="mt-4 text-lg font-bold text-charcoal">
          まだ勉強してる?
        </p>
        <p className="mt-1 text-sm text-charcoal-soft">
          しばらく操作がなかったみたい。{rabbitName}が心配してるよ。
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="rounded-full bg-pink-deep px-6 py-3 font-bold text-charcoal shadow-sm transition active:scale-95"
          >
            つづける
          </button>
          <button
            type="button"
            onClick={onEnd}
            className="rounded-full bg-transparent px-6 py-3 font-bold text-charcoal-soft transition active:scale-95"
          >
            おわる
          </button>
        </div>
      </motion.div>
    </div>
  );
}
