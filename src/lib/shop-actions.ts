"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { CoinReason } from "@/generated/prisma";
import {
  findShopItem,
  isAccessoryId,
  isOutfitId,
  isFurnitureId,
  isConsumableId,
  type FurnitureSlot,
} from "@/lib/shop";

export type PurchaseResult =
  | { status: "ok"; newBalance: number }
  | { status: "error"; message: string };

// おみせ・ホーム・比較ウィジェット・比較詳細画面すべてでうさぎ/残高を出しているため、
// 購入・装備の変更はlayout単位で再検証する(auth-actions.tsのupdateNamesActionと同じ考え方)。
function revalidateRabbitSurfaces() {
  revalidatePath("/", "layout");
}

// 消耗品(にんじん・はちみつミルク・よつばのクローバー)を購入し、その場であげる/使う
// (消耗品のため所持記録は残さない)。
export async function purchaseConsumableAction(itemId: string): Promise<PurchaseResult> {
  const user = await getCurrentUser();
  if (!isConsumableId(itemId)) {
    return { status: "error", message: "その商品は みつからなかったよ" };
  }
  const item = findShopItem(itemId);
  if (!item) {
    return { status: "error", message: "その商品は みつからなかったよ" };
  }
  if (user.coinBalance < item.price) {
    return { status: "error", message: "コインが たりないみたい" };
  }

  const updated = await db.$transaction(async (tx) => {
    await tx.coinTransaction.create({
      data: { userId: user.id, amount: -item.price, reason: CoinReason.PURCHASE, refId: null },
    });
    return tx.user.update({
      where: { id: user.id },
      data: { coinBalance: { decrement: item.price } },
      select: { coinBalance: true },
    });
  });

  revalidateRabbitSurfaces();
  return { status: "ok", newBalance: updated.coinBalance };
}

// 買い切り品(アクセサリー・おようふく・家具)を購入する(所持のみ、装備は別アクション)。
export async function purchaseOwnedItemAction(itemId: string): Promise<PurchaseResult> {
  const user = await getCurrentUser();
  if (!isAccessoryId(itemId) && !isOutfitId(itemId) && !isFurnitureId(itemId)) {
    return { status: "error", message: "その商品は みつからなかったよ" };
  }
  const item = findShopItem(itemId);
  if (!item) {
    return { status: "error", message: "その商品は みつからなかったよ" };
  }

  const alreadyOwned = await db.ownedItem.findUnique({
    where: { userId_itemId: { userId: user.id, itemId } },
  });
  if (alreadyOwned) {
    return { status: "error", message: "もう もってるよ" };
  }
  if (user.coinBalance < item.price) {
    return { status: "error", message: "コインが たりないみたい" };
  }

  try {
    const updated = await db.$transaction(async (tx) => {
      await tx.ownedItem.create({ data: { userId: user.id, itemId } });
      await tx.coinTransaction.create({
        data: { userId: user.id, amount: -item.price, reason: CoinReason.PURCHASE, refId: null },
      });
      return tx.user.update({
        where: { id: user.id },
        data: { coinBalance: { decrement: item.price } },
        select: { coinBalance: true },
      });
    });

    revalidateRabbitSurfaces();
    return { status: "ok", newBalance: updated.coinBalance };
  } catch {
    // @@unique([userId, itemId]) 競合(連打等)時は「もう買われている」扱いにする。
    return { status: "error", message: "もう もってるよ" };
  }
}

export type EquipResult = { error?: string; success?: true };

// 装備中アクセサリー(あたま・かお)を切り替える(itemId=nullではずす)。所持していないアイテムは装備できない。
export async function equipAccessoryAction(itemId: string | null): Promise<EquipResult> {
  const user = await getCurrentUser();

  if (itemId !== null) {
    if (!isAccessoryId(itemId)) {
      return { error: "その商品は みつからなかったよ" };
    }
    const owned = await db.ownedItem.findUnique({
      where: { userId_itemId: { userId: user.id, itemId } },
    });
    if (!owned) {
      return { error: "もっていないアイテムは そうびできないよ" };
    }
  }

  await db.rabbit.update({
    where: { userId: user.id },
    data: { equippedItemId: itemId },
  });

  revalidateRabbitSurfaces();
  return { success: true };
}

// 装備中「おようふく」(からだ)を切り替える(itemId=nullではずす)。あたま・かおとは別スロットのため
// 両方同時に装備できる。
export async function equipOutfitAction(itemId: string | null): Promise<EquipResult> {
  const user = await getCurrentUser();

  if (itemId !== null) {
    if (!isOutfitId(itemId)) {
      return { error: "その商品は みつからなかったよ" };
    }
    const owned = await db.ownedItem.findUnique({
      where: { userId_itemId: { userId: user.id, itemId } },
    });
    if (!owned) {
      return { error: "もっていないアイテムは そうびできないよ" };
    }
  }

  await db.rabbit.update({
    where: { userId: user.id },
    data: { equippedOutfitId: itemId },
  });

  revalidateRabbitSurfaces();
  return { success: true };
}

// ホーム画面の「おへや」に置く家具を切り替える(itemId=nullで片付ける)。
// 商品側のslotと指定slotが一致しないものは置けない(誤った枠への設置を防ぐ)。
export async function equipFurnitureAction(slot: FurnitureSlot, itemId: string | null): Promise<EquipResult> {
  const user = await getCurrentUser();

  if (itemId !== null) {
    if (!isFurnitureId(itemId)) {
      return { error: "その商品は みつからなかったよ" };
    }
    const item = findShopItem(itemId);
    if (!item || item.slot !== slot) {
      return { error: "その場所には おけないみたい" };
    }
    const owned = await db.ownedItem.findUnique({
      where: { userId_itemId: { userId: user.id, itemId } },
    });
    if (!owned) {
      return { error: "もっていないアイテムは おけないよ" };
    }
  }

  await db.rabbit.update({
    where: { userId: user.id },
    data: slot === "left" ? { roomLeftItemId: itemId } : { roomBackItemId: itemId },
  });

  revalidateRabbitSurfaces();
  return { success: true };
}
