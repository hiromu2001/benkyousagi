import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { computeCurrentEnergy } from "@/lib/rabbit-status";
import { NameEditClient } from "./NameEditClient";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const energy = user.rabbit ? computeCurrentEnergy(user.rabbit.energy, user.rabbit.lastSessionEndAt) : 60;

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-14">
      <div className="flex w-full max-w-md flex-col gap-8">
        <Link
          href="/"
          className="inline-block self-start text-sm text-charcoal-soft transition-colors hover:text-charcoal"
        >
          ← もどる
        </Link>

        <h1 className="text-xl font-bold text-charcoal">せってい</h1>

        <NameEditClient
          initialRabbitName={user.rabbit?.name ?? ""}
          initialDisplayName={user.displayName}
          initialRibbonColor={user.rabbit?.ribbonColor ?? "CREAM"}
          energy={energy}
          equippedItem={user.rabbit?.equippedItemId ?? null}
        />

        <Link
          href="/settings/pin"
          className="flex items-center justify-between rounded-2xl bg-milk px-5 py-4 text-sm font-bold text-charcoal shadow-sm transition active:scale-95 sm:hover:shadow-md"
        >
          PINを へんこうする
          <span aria-hidden>→</span>
        </Link>
      </div>
    </main>
  );
}
