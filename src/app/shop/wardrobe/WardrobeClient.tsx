'use client';

import { useState, useTransition } from "react";
import clsx from "clsx";
import Link from "next/link";
import Rabbit from "@/components/rabbit/Rabbit";
import { RabbitRoomScene } from "@/components/rabbit/RabbitRoomScene";
import { FURNITURE_COMPONENTS } from "@/components/rabbit/RoomFurniture";
import { equipAccessoryAction, equipOutfitAction, equipFurnitureAction } from "@/lib/shop-actions";
import { SHOP_ITEMS, type AccessoryId, type OutfitId, type FurnitureId, type FurnitureSlot } from "@/lib/shop";

// 「きがえる」画面。おみせ(買う)とは別に、すでに持っているアクセサリー・おようふく・
// おへやの家具の着せ替え/配置だけに専念する(商品が増えても、買ったものの中から選ぶだけなので迷わない)。

type RibbonColor = "PINK" | "LAVENDER" | "MINT" | "CREAM";

const ROOM_SLOT_LABELS: Record<FurnitureSlot, string> = { left: "ひだり", back: "おく" };

export default function WardrobeClient({
  rabbitName,
  ribbonColor,
  energy,
  initialEquippedItem,
  initialEquippedOutfit,
  initialRoomLeftItemId,
  initialRoomBackItemId,
  ownedItemIds,
}: {
  rabbitName: string;
  ribbonColor: RibbonColor;
  energy: number;
  initialEquippedItem: string | null;
  initialEquippedOutfit: string | null;
  initialRoomLeftItemId: string | null;
  initialRoomBackItemId: string | null;
  ownedItemIds: string[];
}) {
  const [equippedItem, setEquippedItem] = useState<string | null>(initialEquippedItem);
  const [equippedOutfit, setEquippedOutfit] = useState<string | null>(initialEquippedOutfit);
  const [roomLeft, setRoomLeft] = useState<string | null>(initialRoomLeftItemId);
  const [roomBack, setRoomBack] = useState<string | null>(initialRoomBackItemId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ownedAccessories = SHOP_ITEMS.filter(
    (item) => item.category === "accessory" && ownedItemIds.includes(item.id),
  );
  const ownedOutfits = SHOP_ITEMS.filter((item) => item.category === "outfit" && ownedItemIds.includes(item.id));
  const ownedFurniture = SHOP_ITEMS.filter(
    (item) => item.category === "furniture" && ownedItemIds.includes(item.id),
  );

  function equipAccessory(itemId: AccessoryId | null) {
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

  function equipOutfit(itemId: OutfitId | null) {
    if (isPending || equippedOutfit === itemId) return;
    setError(null);
    startTransition(async () => {
      const result = await equipOutfitAction(itemId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEquippedOutfit(itemId);
    });
  }

  function equipFurniture(slot: FurnitureSlot, itemId: FurnitureId | null) {
    const current = slot === "left" ? roomLeft : roomBack;
    if (isPending || current === itemId) return;
    setError(null);
    startTransition(async () => {
      const result = await equipFurnitureAction(slot, itemId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (slot === "left") setRoomLeft(itemId);
      else setRoomBack(itemId);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <RabbitRoomScene
          rabbit={{ energy, name: rabbitName, ribbonColor, equippedItem, equippedOutfit, size: "lg" }}
          leftItemId={roomLeft}
          backItemId={roomBack}
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

      {ownedAccessories.length === 0 && ownedOutfits.length === 0 && ownedFurniture.length === 0 ? (
        <div className="rounded-2xl border border-pink-deep/20 bg-milk p-4 text-center text-sm text-charcoal-soft">
          <p>まだ もちものが ないみたい。</p>
          <Link href="/shop" className="mt-2 inline-block font-bold text-charcoal underline underline-offset-4">
            おみせを のぞいてみる
          </Link>
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-bold text-charcoal-soft">あたま・かお</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => equipAccessory(null)}
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
                    onClick={() => equipAccessory(itemId)}
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
          </section>

          {ownedOutfits.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold text-charcoal-soft">おようふく</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => equipOutfit(null)}
                  disabled={isPending}
                  aria-pressed={equippedOutfit === null}
                  className={clsx(
                    "flex flex-col items-center gap-1.5 rounded-2xl px-3 py-4 text-center shadow-sm transition active:scale-95 disabled:opacity-50",
                    equippedOutfit === null ? "bg-pink-deep/40 ring-2 ring-apricot" : "bg-milk hover:bg-pink/30",
                  )}
                >
                  <Rabbit energy={energy} name={rabbitName} ribbonColor={ribbonColor} equippedOutfit={null} size="sm" />
                  <p className="text-sm font-bold text-charcoal">なにも きない</p>
                </button>

                {ownedOutfits.map((item) => {
                  const itemId = item.id as OutfitId;
                  const equipped = equippedOutfit === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => equipOutfit(itemId)}
                      disabled={isPending}
                      aria-pressed={equipped}
                      className={clsx(
                        "flex flex-col items-center gap-1.5 rounded-2xl px-3 py-4 text-center shadow-sm transition active:scale-95 disabled:opacity-50",
                        equipped ? "bg-pink-deep/40 ring-2 ring-apricot" : "bg-milk hover:bg-pink/30",
                      )}
                    >
                      <Rabbit energy={energy} name={rabbitName} ribbonColor={ribbonColor} equippedOutfit={itemId} size="sm" />
                      <p className="text-sm font-bold text-charcoal">{item.name}</p>
                      <p className="text-[11px] text-charcoal-soft">{equipped ? "そうびちゅう" : "きる"}</p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {ownedFurniture.length > 0 &&
            (["left", "back"] as FurnitureSlot[]).map((slot) => {
              const itemsForSlot = ownedFurniture.filter((item) => item.slot === slot);
              if (itemsForSlot.length === 0) return null;
              const current = slot === "left" ? roomLeft : roomBack;
              return (
                <section key={slot}>
                  <h2 className="mb-3 text-sm font-bold text-charcoal-soft">
                    おへや({ROOM_SLOT_LABELS[slot]})
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => equipFurniture(slot, null)}
                      disabled={isPending}
                      aria-pressed={current === null}
                      className={clsx(
                        "flex flex-col items-center gap-1.5 rounded-2xl px-3 py-4 text-center shadow-sm transition active:scale-95 disabled:opacity-50",
                        current === null ? "bg-pink-deep/40 ring-2 ring-apricot" : "bg-milk hover:bg-pink/30",
                      )}
                    >
                      <div className="flex h-14 w-14 items-center justify-center text-2xl">🌫️</div>
                      <p className="text-sm font-bold text-charcoal">なにも おかない</p>
                    </button>
                    {itemsForSlot.map((item) => {
                      const itemId = item.id as FurnitureId;
                      const equipped = current === item.id;
                      const Icon = FURNITURE_COMPONENTS[itemId];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => equipFurniture(slot, itemId)}
                          disabled={isPending}
                          aria-pressed={equipped}
                          className={clsx(
                            "flex flex-col items-center gap-1.5 rounded-2xl px-3 py-4 text-center shadow-sm transition active:scale-95 disabled:opacity-50",
                            equipped ? "bg-pink-deep/40 ring-2 ring-apricot" : "bg-milk hover:bg-pink/30",
                          )}
                        >
                          <Icon className="h-14 w-auto" />
                          <p className="text-sm font-bold text-charcoal">{item.name}</p>
                          <p className="text-[11px] text-charcoal-soft">{equipped ? "せっちちゅう" : "おく"}</p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
        </>
      )}
    </div>
  );
}
