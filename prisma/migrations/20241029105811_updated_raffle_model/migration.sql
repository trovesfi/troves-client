/*
  Warnings:

  - You are about to drop the column `roundId` on the `LuckyWinner` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,winnerId]` on the table `LuckyWinner` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "LuckyWinner_userId_roundId_key";

-- AlterTable
ALTER TABLE "LuckyWinner" DROP COLUMN "roundId";

-- AlterTable
ALTER TABLE "Raffle" ADD COLUMN     "roundId" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "LuckyWinner_userId_winnerId_key" ON "LuckyWinner"("userId", "winnerId");
