import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma";

// Prisma 7 は Rust エンジンを廃止し、JS ドライバアダプタ経由の接続が必須になった。
// 参照: https://pris.ly/d/prisma7-client-config
//
// libSQL アダプタはローカルの `file:` URL でも Turso 等のリモート `libsql://` URL でも
// 同じ設定形で動くため、無課金の Turso を本番 DB に使いつつローカル開発は素の SQLite ファイルのままにできる。
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
