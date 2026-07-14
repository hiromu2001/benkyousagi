'use client';

import { useState, useTransition } from "react";
import clsx from "clsx";
import Link from "next/link";
import Rabbit from "@/components/rabbit/Rabbit";
import { equipAccessoryAction } from "@/lib/shop-actions";
import { SHOP_ITEMS, type AccessoryId } from "@/lib/shop";

// 「きがえる」画面。おみせ(買う)とは別に、すでに持っているアクセサリーの
// 着せ替えだけに専念する(商品が増えても、買ったものの中から選ぶだけなので迷わない)。

type RibbonColor = "PINK" | "LAVENDER" | "MINT" | "CREAM";

export default function WardrobeClient({
  rabbitName,
  ribbonColor,
  energy,
  initialEquippedItem,
  ownedItemIds,
}: {
  rabbitName: string;
  ribbonColor: RibbonColor;
  energy: number;
  initialEquippedItem: string | null;
  ownedItemIds: string[];
}) {
  const [equippedItem, setEquippedItem] = useState<string | null>(initialEquippedItem);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ownedAccessories = SHOP_ITEMS.filter(
    (item) => item.category === "accessory" && ownedItemIds.includes(item.id),
  );

  function equip(itemId: AccessoryId | null) {
    if (isPending || equippedItem === itemId) return;
    setError(null);
    startTransition(async () => {
      const result = await equipAccessoryAction(itemId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEquippedItem(itemId);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <Rabbit
          energy={energy}
          name={rabbitName}
          ribbonColor={ribbonColor}
          equippedItem={equippedItem}
          size="lg"
        />
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

      {ownedAccessories.length === 0 ? (
        <div className="rounded-2xl border border-pink-deep/20 bg-milk p-4 text-center text-sm text-charcoal-soft">
          <p>まだ もちものが ないみたい。</p>
          <Link href="/shop" className="mt-2 inline-block font-bold text-charcoal underline underline-offset-4">
            おみせを のぞいてみる
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => equip(null)}
            disabled={isPending}
            aria-pressed={equippedItem === null}
            className={clsx(
              "flex flex-col items-center gap-1.5 rounded-2xl px-3 py-4 text-center shadow-sm transition active:scale-95 disabled:opacity-50",
              equippedItem === null ? "bg-pink-deep/40 ring-2 ring-apricot" : "bg-milk hover:bg-pink/30",
            )}
          >
            <Rabbit energy={energy} name={rabbitName} ribbonColor={ribbonColor} equippedItem={null} size="sm" />
            <p className="text-sm font-bold text-charcoal">なにも つけない</p>
          </button>

          {ownedAccessories.map((item) => {
            const itemId = item.id as AccessoryId;
            const equipped = equippedItem === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => equip(itemId)}
                disabled={isPending}
                aria-pressed={equipped}
                className={clsx(
                  "flex flex-col items-center gap-1.5 rounded-2xl px-3 py-4 text-center shadow-sm transition active:scale-95 disabled:opacity-50",
                  equipped ? "bg-pink-deep/40 ring-2 ring-apricot" : "bg-milk hover:bg-pink/30",
                )}
              >
                <Rabbit energy={energy} name={rabbitName} ribbonColor={ribbonColor} equippedItem={itemId} size="sm" />
                <p className="text-sm font-bold text-charcoal">{item.name}</p>
                <p className="text-[11px] text-charcoal-soft">{equipped ? "そうびちゅう" : "つける"}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
