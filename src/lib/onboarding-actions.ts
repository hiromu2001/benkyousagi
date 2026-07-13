"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { RibbonColor } from "@/generated/prisma";

const DEFAULT_NAME = "おもち";
const MAX_NAME_LENGTH = 10;
const VALID_RIBBON_COLORS = Object.values(RibbonColor);

// 初回オンボーディング(うさぎの命名・リボン色決定・世界観説明)の完了処理。
export async function completeOnboardingAction(
  name: string,
  ribbonColor: RibbonColor,
): Promise<void> {
  const user = await getCurrentUser();

  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
  const finalName = trimmed.length > 0 ? trimmed : DEFAULT_NAME;
  const finalRibbonColor = VALID_RIBBON_COLORS.includes(ribbonColor)
    ? ribbonColor
    : RibbonColor.CREAM;

  await db.rabbit.update({
    where: { userId: user.id },
    data: {
      name: finalName,
      ribbonColor: finalRibbonColor,
      onboardedAt: new Date(),
    },
  });

  // 比較ウィジェットは root layout にあるため、ページ単位でなくレイアウト単位で再検証する。
  revalidatePath("/", "layout");
  redirect("/");
}
