"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { jstDateKey } from "@/lib/jst";
import { asMoodLevel, type MoodLevel } from "@/lib/mood";

export type SubmitMoodResult =
  | { status: "created"; level: MoodLevel }
  | { status: "already"; level: MoodLevel; message: string }
  | { status: "error"; message: string };

const ALREADY_MESSAGE = "きょうの きぶんは もう きいたよ！また あした ね";

// 「きょうのきぶん」を記録する(JST基準で1日1回)。
// すでに答えている日は上書きせず "already" を返す(サイレント上書き禁止)。
export async function submitMoodAction(rawLevel: number): Promise<SubmitMoodResult> {
  const user = await getCurrentUser();

  const level = asMoodLevel(rawLevel);
  if (level === null) {
    return { status: "error", message: "きぶんを えらんでね" };
  }

  const moodDate = jstDateKey();

  // DB往復(ネットワーク断等)を含めここから先で予期せず例外が飛んでも、素の例外を
  // クライアントまで伝播させず(サーバーエラー画面になってしまう)、やさしいメッセージにして返す。
  try {
    const existing = await db.moodEntry.findUnique({
      where: { userId_moodDate: { userId: user.id, moodDate } },
    });
    const existingLevel = asMoodLevel(existing?.level);
    if (existingLevel !== null) {
      return { status: "already", level: existingLevel, message: ALREADY_MESSAGE };
    }

    try {
      await db.moodEntry.create({
        data: { userId: user.id, moodDate, level },
      });
    } catch {
      // @@unique([userId, moodDate]) 競合(二重タップ等)時は先勝ちにして「もう答えたよ」を返す。
      const raced = await db.moodEntry.findUnique({
        where: { userId_moodDate: { userId: user.id, moodDate } },
      });
      const racedLevel = asMoodLevel(raced?.level);
      if (racedLevel !== null) {
        return { status: "already", level: racedLevel, message: ALREADY_MESSAGE };
      }
      return { status: "error", message: "うまく とどかなかったみたい…もういちど ためしてね" };
    }

    return { status: "created", level };
  } catch {
    return { status: "error", message: "うまく とどかなかったみたい…もういちど ためしてね" };
  }
}
