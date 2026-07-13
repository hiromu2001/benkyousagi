// `prisma migrate deploy` の CLI は datasource URL のスキームを内部で検証しており、
// libsql:// (Turso) を認識できず P1013 で失敗する(Prisma Client + アダプタ経由の実行時
// 接続とは別の制限)。そのため本番(Turso)へのマイグレーション適用はこのスクリプトが
// prisma/migrations 配下の SQL を直接 libSQL クライアントで実行する形で肩代わりする。
import { createClient } from "@libsql/client";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "prisma", "migrations");

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url) {
  throw new Error("DATABASE_URL が設定されていません");
}

const client = createClient({ url, authToken });

await client.execute(`
  CREATE TABLE IF NOT EXISTS _turso_migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const applied = new Set(
  (await client.execute("SELECT id FROM _turso_migrations")).rows.map((r) => r.id),
);

const migrationIds = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

let appliedCount = 0;
for (const id of migrationIds) {
  if (applied.has(id)) continue;

  const sql = readFileSync(path.join(migrationsDir, id, "migration.sql"), "utf-8");
  await client.executeMultiple(sql);
  await client.execute({ sql: "INSERT INTO _turso_migrations (id) VALUES (?)", args: [id] });
  console.log(`applied migration: ${id}`);
  appliedCount++;
}

if (appliedCount === 0) {
  console.log("No pending migrations to apply.");
}

client.close();
