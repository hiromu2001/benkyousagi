'use client';

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import Rabbit from "@/components/rabbit/Rabbit";
import { Carrot } from "@/components/rabbit/Carrot";
import { HoneyMilk } from "@/components/rabbit/HoneyMilk";
import { CloverCharm } from "@/components/rabbit/CloverCharm";
import { FURNITURE_COMPONENTS } from "@/components/rabbit/RoomFurniture";
import {
  purchaseConsumableAction,
  purchaseOwnedItemAction,
  equipAccessoryAction,
  equipOutfitAction,
  equipFurnitureAction,
} from "@/lib/shop-actions";
import {
  SHOP_ITEMS,
  CARROT_TREAT_ID,
  HONEY_MILK_ID,
  CLOVER_CHARM_ID,
  type AccessoryId,
  type OutfitId,
  type FurnitureId,
} from "@/lib/shop";

// おみせ画面(REQUIREMENTS.md 3-7節・5-3節)。うさぎプレビュー+コイン残高、
// 「たべもの」「おまじない」「みにつけるもの」「おようふく」「おへやのかぐ」の5区分。
// 購入はタグ削除等と同じ二段タップの確認方式。

type RibbonColor = "PINK" | "LAVENDER" | "MINT" | "CREAM";
type FeedPhase = "idle" | "eating";

const CONSUMABLE_ICONS: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  [CARROT_TREAT_ID]: Carrot,
  [HONEY_MILK_ID]: HoneyMilk,
};

const FORTUNE_LINES = [
  "きょうは いいことあるよ、きっと",
  "むりせず ちょっとずつで だいじょうぶ",
  "がんばってる きみを ちゃんと みてるよ",
  "きょうの きみに はなまる",
  "ゆっくりでも まえに すすんでるよ",
  "きょうも おつかれさま",
  "ふたりとも、いいちょうし！",
  "しあわせは ちいさなことの つみかさね",
];

const CONFIRM_RESET_MS = 3000;

export default function ShopClient({
  rabbitName,
  ribbonColor,
  energy,
  initialCoinBalance,
  initialEquippedItem,
  initialEquippedOutfit,
  initialRoomLeftItemId,
  initialRoomBackItemId,
  initialOwnedItemIds,
}: {
  rabbitName: string;
  ribbonColor: RibbonColor;
  energy: number;
  initialCoinBalance: number;
  initialEquippedItem: string | null;
  initialEquippedOutfit: string | null;
  initialRoomLeftItemId: string | null;
  initialRoomBackItemId: string | null;
  initialOwnedItemIds: string[];
}) {
  const [coinBalance, setCoinBalance] = useState(initialCoinBalance);
  const [equippedItem, setEquippedItem] = useState<string | null>(initialEquippedItem);
  const [equippedOutfit, setEquippedOutfit] = useState<string | null>(initialEquippedOutfit);
  const [ownedItemIds, setOwnedItemIds] = useState<Set<string>>(new Set(initialOwnedItemIds));
  // 上のプレビューで「試着」するための一時選択(実際の装備とは別。ボタンで買う/そうびするまで確定しない)。
  const [previewItem, setPreviewItem] = useState<AccessoryId | null>(null);
  const [previewOutfit, setPreviewOutfit] = useState<OutfitId | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [feedPhase, setFeedPhase] = useState<FeedPhase>("idle");
  const [feedItemId, setFeedItemId] = useState<string | null>(null);
  const [fortune, setFortune] = useState<string | null>(null);
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

  function buyConsumable(itemId: string) {
    if (isPending) return;
    if (confirmId !== itemId) {
      armConfirm(itemId);
      return;
    }
    if (confirmResetTimer.current) clearTimeout(confirmResetTimer.current);
    setConfirmId(null);
    setError(null);
    startTransition(async () => {
      const result = await purchaseConsumableAction(itemId);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setCoinBalance(result.newBalance);
      if (itemId === CLOVER_CHARM_ID) {
        setFortune(FORTUNE_LINES[Math.floor(Math.random() * FORTUNE_LINES.length)]);
        setCelebrating(true);
        timersRef.current.push(window.setTimeout(() => setCelebrating(false), 1400));
        timersRef.current.push(window.setTimeout(() => setFortune(null), 4000));
        return;
      }
      setFeedItemId(itemId);
      setFeedPhase("eating");
      timersRef.current.push(window.setTimeout(() => setCelebrating(true), 900));
      timersRef.current.push(window.setTimeout(() => {
        setFeedPhase("idle");
        setCelebrating(false);
      }, 1600));
    });
  }

  function buyOwnedItem(itemId: string) {
    if (isPending) return;
    if (confirmId !== itemId) {
      armConfirm(itemId);
      return;
    }
    if (confirmResetTimer.current) clearTimeout(confirmResetTimer.current);
    setConfirmId(null);
    setError(null);
    startTransition(async () => {
      const result = await purchaseOwnedItemAction(itemId);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setCoinBalance(result.newBalance);
      setOwnedItemIds((prev) => new Set(prev).add(itemId));
    });
  }

  function toggleEquipAccessory(itemId: AccessoryId) {
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
      setPreviewItem(null);
    });
  }

  function toggleEquipOutfit(itemId: OutfitId) {
    if (isPending) return;
    const next = equippedOutfit === itemId ? null : itemId;
    setError(null);
    startTransition(async () => {
      const result = await equipOutfitAction(next);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEquippedOutfit(next);
      setPreviewOutfit(null);
    });
  }

  const [roomLeft, setRoomLeft] = useState<string | null>(initialRoomLeftItemId);
  const [roomBack, setRoomBack] = useState<string | null>(initialRoomBackItemId);

  function toggleEquipFurniture(itemId: FurnitureId, slot: "left" | "back") {
    if (isPending) return;
    const current = slot === "left" ? roomLeft : roomBack;
    const next = current === itemId ? null : itemId;
    setError(null);
    startTransition(async () => {
      const result = await equipFurnitureAction(slot, next);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (slot === "left") setRoomLeft(next);
      else setRoomBack(next);
    });
  }

  const foodItems = SHOP_ITEMS.filter((item) => item.category === "food");
  const charmItems = SHOP_ITEMS.filter((item) => item.category === "charm");
  const accessoryItems = SHOP_ITEMS.filter((item) => item.category === "accessory");
  const outfitItems = SHOP_ITEMS.filter((item) => item.category === "outfit");
  const furnitureItems = SHOP_ITEMS.filter((item) => item.category === "furniture");

  const feedIcon = feedItemId ? CONSUMABLE_ICONS[feedItemId] : null;
  const FeedIconComponent = feedIcon;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <Rabbit
            energy={energy}
            name={rabbitName}
            ribbonColor={ribbonColor}
            equippedItem={previewItem ?? equippedItem}
            equippedOutfit={previewOutfit ?? equippedOutfit}
            size="lg"
            celebrate={celebrating}
          />
          <AnimatePresence>
            {feedPhase === "eating" && FeedIconComponent && (
              <motion.div
                key="feed"
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
                <FeedIconComponent className="h-full w-full" />
              </motion.div>
            )}
            {fortune && (
              <motion.div
                key="fortune"
                className="pointer-events-none absolute -top-2 right-0 max-w-[180px] rounded-2xl border border-pink-deep/20 bg-milk px-3 py-2 text-[11px] text-charcoal shadow-sm"
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                {fortune}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-apricot/40 px-4 py-1.5 text-sm font-bold text-charcoal">
          <span aria-hidden>🪙</span> {coinBalance}
        </span>
        {(previewItem || previewOutfit) && (
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
        <div className="flex flex-col gap-2">
          {foodItems.map((item) => {
            const Icon = CONSUMABLE_ICONS[item.id];
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-milk px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {Icon && <Icon className="h-8 w-8 shrink-0" />}
                  <div>
                    <p className="text-sm font-bold text-charcoal">{item.name}</p>
                    <p className="text-xs text-charcoal-soft">たべさせてあげよう(なんかいでも)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => buyConsumable(item.id)}
                  disabled={isPending}
                  className={clsx(
                    "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50",
                    confirmId === item.id ? "bg-apricot text-charcoal" : "bg-pink/50 text-charcoal hover:bg-pink/70",
                  )}
                >
                  {confirmId === item.id ? "ほんとに あげる？" : `${item.price}コインで あげる`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold text-charcoal-soft">おまじない</h2>
        <div className="flex flex-col gap-2">
          {charmItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-milk px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <CloverCharm className="h-8 w-8 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-charcoal">{item.name}</p>
                  <p className="text-xs text-charcoal-soft">つかうと、うらないが ひとつ もらえるよ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => buyConsumable(item.id)}
                disabled={isPending}
                className={clsx(
                  "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50",
                  confirmId === item.id ? "bg-apricot text-charcoal" : "bg-pink/50 text-charcoal hover:bg-pink/70",
                )}
              >
                {confirmId === item.id ? "ほんとに つかう？" : `${item.price}コインで つかう`}
              </button>
            </div>
          ))}
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
                  onClick={() => setPreviewItem((prev) => (prev === itemId ? null : itemId))}
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
                      onClick={() => toggleEquipAccessory(itemId)}
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
                    onClick={() => buyOwnedItem(itemId)}
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

      <section>
        <h2 className="mb-3 text-sm font-bold text-charcoal-soft">おようふく</h2>
        <div className="grid grid-cols-2 gap-3">
          {outfitItems.map((item) => {
            const itemId = item.id as OutfitId;
            const owned = ownedItemIds.has(item.id);
            const equipped = equippedOutfit === item.id;
            const previewing = previewOutfit === item.id;
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
                  onClick={() => setPreviewOutfit((prev) => (prev === itemId ? null : itemId))}
                  aria-pressed={previewing}
                  aria-label={`${item.name}を しちゃくする`}
                  className="rounded-full transition active:scale-95"
                >
                  <Rabbit energy={energy} name={rabbitName} ribbonColor={ribbonColor} equippedOutfit={itemId} size="sm" />
                </button>
                <p className="text-sm font-bold text-charcoal">{item.name}</p>
                {owned ? (
                  <>
                    <p className="text-[11px] text-charcoal-soft">もってるよ</p>
                    <button
                      type="button"
                      onClick={() => toggleEquipOutfit(itemId)}
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
                    onClick={() => buyOwnedItem(itemId)}
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

      <section>
        <h2 className="mb-3 text-sm font-bold text-charcoal-soft">おへやのかぐ</h2>
        <p className="mb-2 -mt-2 text-[11px] text-charcoal-soft">ホーム画面の うさぎの まわりに おける よ</p>
        <div className="grid grid-cols-2 gap-3">
          {furnitureItems.map((item) => {
            const itemId = item.id as FurnitureId;
            const owned = ownedItemIds.has(item.id);
            const slot = item.slot!;
            const equipped = (slot === "left" ? roomLeft : roomBack) === item.id;
            const Icon = FURNITURE_COMPONENTS[itemId];
            return (
              <div
                key={item.id}
                className={clsx(
                  "flex flex-col items-center gap-1.5 rounded-2xl px-3 py-4 text-center shadow-sm transition",
                  equipped ? "bg-pink-deep/40" : "bg-milk",
                )}
              >
                <Icon className="h-14 w-auto" />
                <p className="text-sm font-bold text-charcoal">{item.name}</p>
                {owned ? (
                  <>
                    <p className="text-[11px] text-charcoal-soft">もってるよ</p>
                    <button
                      type="button"
                      onClick={() => toggleEquipFurniture(itemId, slot)}
                      disabled={isPending}
                      className={clsx(
                        "mt-1 w-full rounded-full px-3 py-1.5 text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50",
                        equipped ? "bg-charcoal-soft/30 text-charcoal" : "bg-apricot text-charcoal hover:opacity-90",
                      )}
                    >
                      {equipped ? "かたづける" : "おく"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => buyOwnedItem(itemId)}
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
