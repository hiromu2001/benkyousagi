import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { computeCurrentEnergy } from "@/lib/rabbit-status";
import WardrobeClient from "./WardrobeClient";

// 「きがえる」画面(REQUIREMENTS.md 3-7節): おみせ(買う)とは分けて、
// すでに持っているアクセサリーの着せ替えだけに専念する画面。商品が増えても迷わないように。
export default async function WardrobePage() {
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
          href="/shop"
          className="inline-block self-start text-sm text-charcoal-soft transition-colors hover:text-charcoal"
        >
          ← おみせへもどる
        </Link>

        <h1 className="text-xl font-bold text-charcoal">きがえる</h1>

        <WardrobeClient
          rabbitName={rabbit?.name ?? "おもち"}
          ribbonColor={rabbit?.ribbonColor ?? "CREAM"}
          energy={energy}
          initialEquippedItem={rabbit?.equippedItemId ?? null}
          initialEquippedOutfit={rabbit?.equippedOutfitId ?? null}
          initialRoomLeftItemId={rabbit?.roomLeftItemId ?? null}
          initialRoomBackItemId={rabbit?.roomBackItemId ?? null}
          ownedItemIds={ownedItems.map((i) => i.itemId)}
        />
      </div>
    </main>
  );
}
