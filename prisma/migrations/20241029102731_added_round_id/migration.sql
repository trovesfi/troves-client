/*
  Warnings:

  - The primary key for the `LuckyWinner` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `winnerId` on the `LuckyWinner` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[roundId]` on the table `LuckyWinner` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,roundId]` on the table `LuckyWinner` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "LuckyWinner_userId_winnerId_key";

-- AlterTable
ALTER TABLE "LuckyWinner" DROP CONSTRAINT "LuckyWinner_pkey",
DROP COLUMN "winnerId",
ADD COLUMN     "roundId" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "LuckyWinner_roundId_key" ON "LuckyWinner"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "LuckyWinner_userId_roundId_key" ON "LuckyWinner"("userId", "roundId");
