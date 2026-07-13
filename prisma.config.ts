import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7: datasource の url は schema.prisma から撤去され、こちらに一本化された。
// 参照: https://pris.ly/d/config-datasource
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
