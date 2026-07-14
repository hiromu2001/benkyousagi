import "dotenv/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const db = new PrismaClient({ adapter });

// REQUIREMENTS.md 3-1節: 固定2アカウント制。第三者向けのサインアップ導線は存在しないため、
// 運用開始前にこのスクリプトで一度だけアカウントを作成する(`npm run db:seed`)。
async function upsertUser(name: string | undefined, pin: string | undefined, fallbackName: string, fallbackPin: string) {
  const displayName = name || fallbackName;
  const pinHash = await bcrypt.hash(pin || fallbackPin, 10);

  const user = await db.user.upsert({
    where: { displayName },
    update: {},
    create: {
      displayName,
      pinHash,
      // オンボーディング未実施の間の初期名は「おもち」固定ではなく、アカウント名(ユーザー1/2等)に
      // 揃える(2026-07-15: ログイン画面で誰のうさぎか分かりやすくするための変更)。
      // オンボーディング完了時にユーザー自身が付けた名前で上書きされる。
      rabbit: { create: { name: displayName } },
    },
  });
  console.log(`seeded user: ${user.displayName} (id=${user.id})`);
}

async function main() {
  await upsertUser(
    process.env.SEED_USER1_NAME,
    process.env.SEED_USER1_PIN,
    "ユーザー1",
    "123456",
  );
  await upsertUser(
    process.env.SEED_USER2_NAME,
    process.env.SEED_USER2_PIN,
    "ユーザー2",
    "654321",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
