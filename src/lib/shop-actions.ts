"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { CoinReason } from "@/generated/prisma";
import { CARROT_TREAT_ID, findShopItem, isAccessoryId } from "@/lib/shop";

export type PurchaseResult =
  | { status: "ok"; newBalance: number }
  | { status: "error"; message: string };

// おみせ・ホーム・比較ウィジェット・比較詳細画面すべてでうさぎ/残高を出しているため、
// 購入・装備の変更はlayout単位で再検証する(auth-actions.tsのupdateNamesActionと同じ考え方)。
function revalidateRabbitSurfaces() {
  revalidatePath("/", "layout");
}

// おやつのにんじんを購入し、その場であげる(消耗品のため所持記録は残さない)。
export async function purchaseCarrotAction(): Promise<PurchaseResult> {
  const user = await getCurrentUser();
  const item = findShopItem(CARROT_TREAT_ID);
  if (!item) {
    return { status: "error", message: "うまく とどかなかったみたい…もういちど ためしてね" };
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

// アクセサリーを購入する(買い切り。装備はせず所持のみ、装備は別アクション)。
export async function purchaseAccessoryAction(itemId: string): Promise<PurchaseResult> {
  const user = await getCurrentUser();
  if (!isAccessoryId(itemId)) {
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

// 装備中アクセサリーを切り替える(itemId=nullではずす)。所持していないアイテムは装備できない。
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
