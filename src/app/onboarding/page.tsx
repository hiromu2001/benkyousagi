import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { OnboardingClient } from "./OnboardingClient";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  const rabbit = user.rabbit;

  if (!rabbit) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-charcoal">うさぎの じゅんび中だよ。すこし まってね。</p>
      </main>
    );
  }

  // 完了済みなのに直接アクセスされた場合はホームへ戻す(再オンボーディング防止)
  if (rabbit.onboardedAt) {
    redirect("/");
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-md">
        <OnboardingClient
          initialRibbonColor={rabbit.ribbonColor}
          initialDisplayName={user.displayName}
        />
      </div>
    </main>
  );
}
