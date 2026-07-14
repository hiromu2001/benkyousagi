import "server-only";
import { db } from "@/lib/db";
import { jstDateKey } from "@/lib/jst";

// 比較詳細画面のログイン履歴用(REQUIREMENTS.md 5-1節)。PINでの明示的なログインだけでなく、
// セッションCookieが有効なままの再訪(getCurrentUser経由)も対象にする。
// 1ユーザー1日1行に集約し、同じ日の再訪では時刻だけを最新へ更新する。
export async function recordVisit(userId: string): Promise<void> {
  const visitDate = jstDateKey();
  await db.loginEvent.upsert({
    where: { userId_visitDate: { userId, visitDate } },
    create: { userId, visitDate },
    update: { loggedInAt: new Date() },
  });
}
