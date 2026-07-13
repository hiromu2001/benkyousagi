"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
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

const MAX_NAME_LENGTH = 10;
const VALID_RIBBON_COLORS = Object.values(RibbonColor);

// 初回オンボーディング(うさぎの命名・リボン色決定・利用者名決定)の完了処理。
export async function completeOnboardingAction(
  name: string,
  ribbonColor: RibbonColor,
  displayName: string,
): Promise<{ error?: string } | void> {
  const user = await getCurrentUser();

  const trimmedName = name.trim().slice(0, MAX_NAME_LENGTH);
  if (trimmedName.length === 0) {
    return { error: "うさぎの なまえを いれてね" };
  }

  const trimmedDisplayName = displayName.trim().slice(0, MAX_NAME_LENGTH);
  if (trimmedDisplayName.length === 0) {
    return { error: "あなたの なまえを いれてね" };
  }

  const finalRibbonColor = VALID_RIBBON_COLORS.includes(ribbonColor)
    ? ribbonColor
    : RibbonColor.CREAM;

  try {
    await db.user.update({
      where: { id: user.id },
      data: { displayName: trimmedDisplayName },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "そのなまえは もうつかわれているみたい" };
    }
    throw error;
  }

  await db.rabbit.update({
    where: { userId: user.id },
    data: {
      name: trimmedName,
      ribbonColor: finalRibbonColor,
      onboardedAt: new Date(),
    },
  });

  // 比較ウィジェットは root layout にあるため、ページ単位でなくレイアウト単位で再検証する。
  revalidatePath("/", "layout");
  redirect("/");
}
