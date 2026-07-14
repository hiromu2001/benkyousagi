/*
  Warnings:

  - Added the required column `visitDate` to the `LoginEvent` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LoginEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "visitDate" TEXT NOT NULL,
    "loggedInAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoginEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LoginEvent" ("id", "loggedInAt", "userId") SELECT "id", "loggedInAt", "userId" FROM "LoginEvent";
DROP TABLE "LoginEvent";
ALTER TABLE "new_LoginEvent" RENAME TO "LoginEvent";
CREATE INDEX "LoginEvent_userId_loggedInAt_idx" ON "LoginEvent"("userId", "loggedInAt");
CREATE UNIQUE INDEX "LoginEvent_userId_visitDate_key" ON "LoginEvent"("userId", "visitDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
