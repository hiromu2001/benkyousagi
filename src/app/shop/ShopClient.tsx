'use client';

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import Rabbit from "@/components/rabbit/Rabbit";
import { Carrot } from "@/components/rabbit/Carrot";
import { purchaseCarrotAction, purchaseAccessoryAction, equipAccessoryAction } from "@/lib/shop-actions";
import { SHOP_ITEMS, CARROT_TREAT_ID, type AccessoryId } from "@/lib/shop";

// おみせ画面(REQUIREMENTS.md 3-7節・5-3節)。うさぎプレビュー+コイン残高、
// 「たべもの」「みにつけるもの」の2区分。購入はタグ削除等と同じ二段タップの確認方式。

type RibbonColor = "PINK" | "LAVENDER" | "MINT" | "CREAM";
type CarrotPhase = "idle" | "eating";

const CONFIRM_RESET_MS = 3000;

export default function ShopClient({
  rabbitName,
  ribbonColor,
  energy,
  initialCoinBalance,
  initialEquippedItem,
  initialOwnedItemIds,
}: {
  rabbitName: string;
  ribbonColor: RibbonColor;
  energy: number;
  initialCoinBalance: number;
  initialEquippedItem: string | null;
  initialOwnedItemIds: string[];
}) {
  const [coinBalance, setCoinBalance] = useState(initialCoinBalance);
  const [equippedItem, setEquippedItem] = useState<string | null>(initialEquippedItem);
  const [ownedItemIds, setOwnedItemIds] = useState<Set<string>>(new Set(initialOwnedItemIds));
  // 上のプレビューで「試着」するための一時選択(実際の装備とは別。ボタンで買う/そうびするまで確定しない)。
  const [previewItem, setPreviewItem] = useState<AccessoryId | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [carrotPhase, setCarrotPhase] = useState<CarrotPhase>("idle");
  const [celebrating, setCelebrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const confirmResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timersRef = useRef<number[]>([]);
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      if (confirmResetTimer.current) clearTimeout(confirmResetTimer.current);
    };
  }, []);

  function armConfirm(id: string) {
    if (confirmResetTimer.current) clearTimeout(confirmResetTimer.current);
    setConfirmId(id);
    confirmResetTimer.current = setTimeout(() => setConfirmId(null), CONFIRM_RESET_MS);
  }

  function buyCarrot() {
    if (isPending) return;
    if (confirmId !== CARROT_TREAT_ID) {
      armConfirm(CARROT_TREAT_ID);
      return;
    }
    if (confirmResetTimer.current) clearTimeout(confirmResetTimer.current);
    setConfirmId(null);
    setError(null);
    startTransition(async () => {
      const result = await purchaseCarrotAction();
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setCoinBalance(result.newBalance);
      setCarrotPhase("eating");
      timersRef.current.push(window.setTimeout(() => setCelebrating(true), 900));
      timersRef.current.push(window.setTimeout(() => setCarrotPhase("idle"), 1600));
    });
  }

  function buyAccessory(itemId: AccessoryId) {
    if (isPending) return;
    if (confirmId !== itemId) {
      armConfirm(itemId);
      return;
    }
    if (confirmResetTimer.current) clearTimeout(confirmResetTimer.current);
    setConfirmId(null);
    setError(null);
    startTransition(async () => {
      const result = await purchaseAccessoryAction(itemId);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setCoinBalance(result.newBalance);
      setOwnedItemIds((prev) => new Set(prev).add(itemId));
    });
  }

  function toggleEquip(itemId: AccessoryId) {
    if (isPending) return;
    const next = equippedItem === itemId ? null : itemId;
    setError(null);
    startTransition(async () => {
      const result = await equipAccessoryAction(next);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEquippedItem(next);
      // 確定したら試着中プレビューは終了し、実際の装備状態をそのまま見せる。
      setPreviewItem(null);
    });
  }

  function togglePreview(itemId: AccessoryId) {
    setPreviewItem((prev) => (prev === itemId ? null : itemId));
  }

  const carrotItem = SHOP_ITEMS.find((item) => item.id === CARROT_TREAT_ID)!;
  const accessoryItems = SHOP_ITEMS.filter((item) => item.category === "accessory");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <Rabbit
            energy={energy}
            name={rabbitName}
            ribbonColor={ribbonColor}
            equippedItem={previewItem ?? equippedItem}
            size="lg"
            celebrate={celebrating}
          />
          <AnimatePresence>
            {carrotPhase === "eating" && (
              <motion.div
                key="carrot"
                className="pointer-events-none absolute bottom-[24%] right-[4%] h-14 w-14"
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
        <span className="flex items-center gap-1 rounded-full bg-apricot/40 px-4 py-1.5 text-sm font-bold text-charcoal">
          <span aria-hidden>🪙</span> {coinBalance}
        </span>
        {previewItem && (
          <p className="text-[11px] text-charcoal-soft">しちゃくちゅう(まだ かってないよ)</p>
        )}
      </div>

      <p
        role="alert"
        className={clsx(
          "min-h-6 rounded-2xl px-4 py-2 text-center text-sm text-charcoal transition-opacity",
          error ? "bg-pink/70 shadow-sm opacity-100" : "opacity-0",
        )}
      >
        {error}
      </p>

      <section>
        <h2 className="mb-3 text-sm font-bold text-charcoal-soft">たべもの</h2>
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-milk px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <Carrot className="h-8 w-8 shrink-0" />
            <div>
              <p className="text-sm font-bold text-charcoal">{carrotItem.name}</p>
              <p className="text-xs text-charcoal-soft">たべさせてあげよう(なんかいでも)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={buyCarrot}
            disabled={isPending}
            className={clsx(
              "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50",
              confirmId === CARROT_TREAT_ID ? "bg-apricot text-charcoal" : "bg-pink/50 text-charcoal hover:bg-pink/70",
            )}
          >
            {confirmId === CARROT_TREAT_ID ? "ほんとに あげる？" : `${carrotItem.price}コインで あげる`}
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold text-charcoal-soft">みにつけるもの</h2>
        <div className="grid grid-cols-2 gap-3">
          {accessoryItems.map((item) => {
            const itemId = item.id as AccessoryId;
            const owned = ownedItemIds.has(item.id);
            const equipped = equippedItem === item.id;
            const previewing = previewItem === item.id;
            return (
              <div
                key={item.id}
                className={clsx(
                  "flex flex-col items-center gap-1.5 rounded-2xl px-3 py-4 text-center shadow-sm transition",
                  equipped ? "bg-pink-deep/40" : "bg-milk",
                  previewing && "ring-2 ring-apricot",
                )}
              >
                <button
                  type="button"
                  onClick={() => togglePreview(itemId)}
                  aria-pressed={previewing}
                  aria-label={`${item.name}を しちゃくする`}
                  className="rounded-full transition active:scale-95"
                >
                  <Rabbit energy={energy} name={rabbitName} ribbonColor={ribbonColor} equippedItem={itemId} size="sm" />
                </button>
                <p className="text-sm font-bold text-charcoal">{item.name}</p>
                {owned ? (
                  <>
                    <p className="text-[11px] text-charcoal-soft">もってるよ</p>
                    <button
                      type="button"
                      onClick={() => toggleEquip(itemId)}
                      disabled={isPending}
                      className={clsx(
                        "mt-1 w-full rounded-full px-3 py-1.5 text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50",
                        equipped ? "bg-charcoal-soft/30 text-charcoal" : "bg-apricot text-charcoal hover:opacity-90",
                      )}
                    >
                      {equipped ? "はずす" : "そうびする"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => buyAccessory(itemId)}
                    disabled={isPending}
                    className={clsx(
                      "mt-1 w-full rounded-full px-3 py-1.5 text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50",
                      confirmId === item.id ? "bg-apricot text-charcoal" : "bg-pink/50 text-charcoal hover:bg-pink/70",
                    )}
                  >
                    {confirmId === item.id ? "ほんとに かう？" : `${item.price}コイン`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
