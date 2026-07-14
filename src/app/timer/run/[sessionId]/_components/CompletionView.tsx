"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Rabbit from "@/components/rabbit/Rabbit";
import type { RibbonColor } from "@/generated/prisma";
import type { ManualEndReason } from "@/lib/timer-actions";
import { formatMinutesLabel } from "../_lib/format";

type Props = {
  reason: ManualEndReason;
  durationMs: number;
  rabbitName: string;
  ribbonColor: RibbonColor;
  equippedItem: string | null;
  energy: number;
  earnedCoins: number;
};

const DECORATIONS = ["🌸", "🌷", "🥕", "⭐", "🍀", "🌼"];

// REQUIREMENTS.md 2-4節・3-3-1-6節:
// COMPLETED(満了) > MANUAL(手動終了) の順で演出を豪華にし、INACTIVITY_AUTOは演出なしで淡々と戻す。
export default function CompletionView({
  reason,
  durationMs,
  rabbitName,
  ribbonColor,
  equippedItem,
  energy,
  earnedCoins,
}: Props) {
  if (reason === "INACTIVITY_AUTO") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <Rabbit energy={energy} name={rabbitName} ribbonColor={ribbonColor} equippedItem={equippedItem} size="sm" />
        <p className="text-charcoal-soft">
          しばらく操作がなかったので、そこまでの記録を保存したよ。
        </p>
        <p className="font-bold text-charcoal">
          {formatMinutesLabel(durationMs)}ぶん、記録したよ
        </p>
        {earnedCoins > 0 && (
          <span className="rounded-full bg-apricot/40 px-3 py-1 text-xs font-bold text-charcoal">
            +{earnedCoins} コイン
          </span>
        )}
        <Link
          href="/"
          className="mt-2 rounded-full bg-pink px-6 py-3 font-bold text-charcoal shadow-sm transition active:scale-95"
        >
          ホームへもどる
        </Link>
      </div>
    );
  }

  const isRich = reason === "COMPLETED";

  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center gap-4 overflow-hidden px-6 text-center">
      {(isRich ? DECORATIONS : DECORATIONS.slice(0, 3)).map((emoji, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute text-3xl"
          style={{ left: `${10 + i * 15}%`, top: "-10%" }}
          initial={{ y: "-10vh", opacity: 0, rotate: 0 }}
          animate={{ y: "90vh", opacity: [0, 1, 1, 0], rotate: 360 }}
          transition={{
            duration: 2.6 + (i % 3) * 0.4,
            delay: i * 0.15,
            repeat: Infinity,
            repeatDelay: 1.2,
            ease: "linear",
          }}
        >
          {emoji}
        </motion.span>
      ))}

      <motion.div
        animate={{ y: [0, -18, 0] }}
        transition={{ duration: 0.7, repeat: isRich ? 4 : 2, repeatType: "loop" }}
      >
        <Rabbit
          energy={energy}
          name={rabbitName}
          ribbonColor={ribbonColor}
          equippedItem={equippedItem}
          size={isRich ? "lg" : "md"}
          celebrate
        />
      </motion.div>

      <p className="text-xl font-bold text-charcoal">
        {isRich ? "やったね！めあて たっせい！" : "がんばったね"}
      </p>
      <p className="text-charcoal-soft">
        きょうも{rabbitName}といっしょに、{formatMinutesLabel(durationMs)}がんばったよ
      </p>
      {earnedCoins > 0 && (
        <span className="rounded-full bg-apricot/40 px-4 py-1.5 text-sm font-bold text-charcoal">
          +{earnedCoins} コイン
        </span>
      )}

      <Link
        href="/"
        className="mt-2 rounded-full bg-apricot px-8 py-3 font-bold text-charcoal shadow-sm transition active:scale-95"
      >
        ホームへもどる
      </Link>
    </div>
  );
}
