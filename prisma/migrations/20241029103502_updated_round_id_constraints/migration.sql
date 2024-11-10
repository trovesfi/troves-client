-- AlterTable
ALTER TABLE "LuckyWinner" ALTER COLUMN "roundId" SET DEFAULT 1,
ADD CONSTRAINT "LuckyWinner_pkey" PRIMARY KEY ("roundId");
