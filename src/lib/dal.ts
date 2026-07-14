import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/lib/db";
import { getSessionPayload } from "@/lib/session";
import { recordVisit } from "@/lib/visit-tracking";

// REQUIREMENTS.md 3-1節 / Next.js Authentication guide の DAL パターンに準拠。
// 認証チェックは各ページ/Server Action/Route Handler で個別に行う
// （layout でのチェックはクライアント遷移時に再実行されないため非推奨）。
export const verifySession = cache(async () => {
  const session = await getSessionPayload();
  if (!session?.userId) {
    redirect("/login");
  }
  return session;
});

export const getCurrentUser = cache(async () => {
  const session = await verifySession();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { rabbit: true },
  });
  if (!user) {
    redirect("/login");
  }
  // ログイン履歴(比較詳細画面)の再訪分。cache()により1リクエストにつき最大1回しか実行されず、
  // after()でレスポンス送信後に行うため描画をブロックしない。
  after(() => recordVisit(user.id).catch(() => {}));
  return user;
});

// ログイン画面など、未認証でも呼べる版（リダイレクトしない）。
export const getOptionalCurrentUser = cache(async () => {
  const session = await getSessionPayload();
  if (!session?.userId) return null;
  return db.user.findUnique({
    where: { id: session.userId },
    include: { rabbit: true },
  });
});
