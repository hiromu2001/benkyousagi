import { db } from "@/lib/db";
import { LoginClient } from "./LoginClient";

export default async function LoginPage() {
  const users = await db.user.findMany({
    select: {
      id: true,
      displayName: true,
      rabbit: { select: { name: true, ribbonColor: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-md">
        <LoginClient users={users} />
      </div>
    </main>
  );
}
