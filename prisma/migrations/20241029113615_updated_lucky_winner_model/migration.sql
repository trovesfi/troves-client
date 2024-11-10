/*
  Warnings:

  - You are about to drop the column `roundId` on the `Raffle` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LuckyWinner" ADD COLUMN     "roundId" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "Raffle" DROP COLUMN "roundId";
