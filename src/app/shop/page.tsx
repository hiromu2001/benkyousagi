import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { computeCurrentEnergy } from "@/lib/rabbit-status";
import ShopClient from "./ShopClient";

export default async function ShopPage() {
  const user = await getCurrentUser();
  const rabbit = user.rabbit;

  const ownedItems = await db.ownedItem.findMany({
    where: { userId: user.id },
    select: { itemId: true },
  });

  const energy = rabbit ? computeCurrentEnergy(rabbit.energy, rabbit.lastSessionEndAt) : 60;

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8 sm:py-12">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Link
          href="/"
          className="inline-block self-start text-sm text-charcoal-soft transition-colors hover:text-charcoal"
        >
          ← もどる
        </Link>

        <h1 className="text-xl font-bold text-charcoal">おみせ</h1>

        <ShopClient
          rabbitName={rabbit?.name ?? "おもち"}
          ribbonColor={rabbit?.ribbonColor ?? "CREAM"}
          energy={energy}
          initialCoinBalance={user.coinBalance}
          initialEquippedItem={rabbit?.equippedItemId ?? null}
          initialOwnedItemIds={ownedItems.map((i) => i.itemId)}
        />
      </div>
    </main>
  );
}
