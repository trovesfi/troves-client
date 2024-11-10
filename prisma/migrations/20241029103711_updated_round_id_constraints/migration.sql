/*
  Warnings:

  - The primary key for the `LuckyWinner` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "LuckyWinner" DROP CONSTRAINT "LuckyWinner_pkey",
ADD COLUMN     "winnerId" SERIAL NOT NULL,
ADD CONSTRAINT "LuckyWinner_pkey" PRIMARY KEY ("winnerId");
