import { getCurrentUser } from "@/lib/dal";
import { PinChangeClient } from "./PinChangeClient";

export default async function SettingsPage() {
  await getCurrentUser();

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-md">
        <PinChangeClient />
      </div>
    </main>
  );
}
