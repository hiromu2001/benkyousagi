'use server';

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { getCurrentUser } from "@/lib/dal";

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
    const nextFailedAttempts = user.failedPinAttempts + 1;

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

  await db.user.update({
    where: { id: user.id },
    data: { failedPinAttempts: 0, lockedUntil: null },
  });

  await createSession(user.id);
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
    return { error: "いまのPINが ちがうみたい" };
  }

  const pinHash = await bcrypt.hash(newPin, 10);
  await db.user.update({
    where: { id: user.id },
    data: { pinHash, failedPinAttempts: 0, lockedUntil: null },
  });

  return { success: true };
}
