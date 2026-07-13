'use server';

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { getCurrentUser } from "@/lib/dal";
import { RibbonColor } from "@/generated/prisma";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

// REQUIREMENTS.md 3-1節 / 10-2節: ロック閾値は実装裁量。2名限定利用のため軽度な待機で十分。
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000;

const loginInputSchema = z.object({
  userId: z.string().min(1),
  pin: z.string().regex(/^\d{4,6}$/, {
    error: "PINは4〜6けたの すうじで にゅうりょくしてね",
  }),
});

function lockedMessage(lockedUntil: Date, now: Date): string {
  const remainMinutes = Math.max(1, Math.ceil((lockedUntil.getTime() - now.getTime()) / 60_000));
  return `ちょっとおやすみタイム。あと${remainMinutes}ふん まってね`;
}

// ロック期限が切れていれば、直前までの失敗回数は0として扱う。
// でないとロック解除直後の1回の誤入力だけで、また5回分たまっていた扱いになり即再ロックしてしまう。
function resolveFailedAttempts(failedPinAttempts: number, lockedUntil: Date | null, now: Date): number {
  if (lockedUntil && lockedUntil <= now) return 0;
  return failedPinAttempts;
}

export async function loginAction(
  userId: string,
  pin: string,
): Promise<{ error?: string }> {
  const parsed = loginInputSchema.safeParse({ userId, pin });
  if (!parsed.success) {
    return { error: "PINは4〜6けたの すうじで にゅうりょくしてね" };
  }

  const user = await db.user.findUnique({
    where: { id: parsed.data.userId },
    select: {
      id: true,
      pinHash: true,
      failedPinAttempts: true,
      lockedUntil: true,
    },
  });

  if (!user) {
    return { error: "あれ、うさぎが みつからなかったみたい" };
  }

  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    return { error: lockedMessage(user.lockedUntil, now) };
  }

  const isValid = await bcrypt.compare(parsed.data.pin, user.pinHash);

  if (!isValid) {
    const nextFailedAttempts = resolveFailedAttempts(user.failedPinAttempts, user.lockedUntil, now) + 1;

    if (nextFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(now.getTime() + LOCK_DURATION_MS);
      await db.user.update({
        where: { id: user.id },
        data: { failedPinAttempts: nextFailedAttempts, lockedUntil },
      });
      return { error: lockedMessage(lockedUntil, now) };
    }

    await db.user.update({
      where: { id: user.id },
      data: { failedPinAttempts: nextFailedAttempts },
    });
    return { error: "あれ、ちがうみたい…もう一回ためしてみて" };
  }

  // 体感速度優先: 失敗カウンタのリセットが必要な時だけ書き込み、セッション発行と並列で行う
  // (成功ログインの通常経路はDB書き込みなしで即座に完了する)。
  const needsReset = user.failedPinAttempts !== 0 || user.lockedUntil !== null;
  await Promise.all([
    createSession(user.id),
    needsReset
      ? db.user.update({
          where: { id: user.id },
          data: { failedPinAttempts: 0, lockedUntil: null },
        })
      : Promise.resolve(),
  ]);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}

// LoginClient.tsx の PIN_LENGTH と同じ固定6桁(表示・自動送信の一貫性のため)。
const newPinSchema = z.string().regex(/^\d{6}$/, {
  error: "PINは6けたの すうじで にゅうりょくしてね",
});

export async function changePinAction(
  currentPin: string,
  newPin: string,
  confirmPin: string,
): Promise<{ error?: string; success?: true }> {
  const user = await getCurrentUser();

  if (!newPinSchema.safeParse(newPin).success) {
    return { error: "あたらしいPINは6けたの すうじで にゅうりょくしてね" };
  }
  if (newPin !== confirmPin) {
    return { error: "あたらしいPINが いっちしないみたい" };
  }

  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    return { error: lockedMessage(user.lockedUntil, now) };
  }

  const isCurrentValid = await bcrypt.compare(currentPin, user.pinHash);
  if (!isCurrentValid) {
    const nextFailedAttempts = resolveFailedAttempts(user.failedPinAttempts, user.lockedUntil, now) + 1;

    if (nextFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(now.getTime() + LOCK_DURATION_MS);
      await db.user.update({
        where: { id: user.id },
        data: { failedPinAttempts: nextFailedAttempts, lockedUntil },
      });
      return { error: lockedMessage(lockedUntil, now) };
    }

    await db.user.update({
      where: { id: user.id },
      data: { failedPinAttempts: nextFailedAttempts },
    });
    return { error: "いまのPINが ちがうみたい" };
  }

  const pinHash = await bcrypt.hash(newPin, 10);
  await db.user.update({
    where: { id: user.id },
    data: { pinHash, failedPinAttempts: 0, lockedUntil: null },
  });

  return { success: true };
}

// onboarding-actions.ts の completeOnboardingAction と同じ桁数制限(10もじ)に揃えている。
const MAX_NAME_LENGTH = 10;
const VALID_RIBBON_COLORS = Object.values(RibbonColor);

export async function updateNamesAction(
  rabbitName: string,
  displayName: string,
  ribbonColor: RibbonColor,
): Promise<{ error?: string; success?: true }> {
  const user = await getCurrentUser();

  const trimmedRabbitName = rabbitName.trim().slice(0, MAX_NAME_LENGTH);
  if (trimmedRabbitName.length === 0) {
    return { error: "うさぎの なまえを いれてね" };
  }

  const trimmedDisplayName = displayName.trim().slice(0, MAX_NAME_LENGTH);
  if (trimmedDisplayName.length === 0) {
    return { error: "あなたの なまえを いれてね" };
  }

  const finalRibbonColor = VALID_RIBBON_COLORS.includes(ribbonColor) ? ribbonColor : RibbonColor.CREAM;

  try {
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { displayName: trimmedDisplayName },
      }),
      db.rabbit.update({
        where: { userId: user.id },
        data: { name: trimmedRabbitName, ribbonColor: finalRibbonColor },
      }),
    ]);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "そのなまえは もうつかわれているみたい" };
    }
    throw error;
  }

  // 比較ウィジェットはホーム画面(src/app/page.tsx)にあるため、layout単位で再検証する。
  revalidatePath("/", "layout");

  return { success: true };
}
