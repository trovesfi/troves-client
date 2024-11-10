-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "isTncSigned" BOOLEAN DEFAULT false,
    "message" TEXT,
    "tncDocVersion" TEXT DEFAULT '1.0',
    "referralCode" TEXT NOT NULL,
    "referralCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Raffle" (
    "raffleId" SERIAL NOT NULL,
    "isRaffleParticipant" BOOLEAN DEFAULT false,
    "sharedOnX" BOOLEAN DEFAULT false,
    "activeDeposits" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Raffle_pkey" PRIMARY KEY ("raffleId")
);

-- CreateTable
CREATE TABLE "LuckyWinner" (
    "winnerId" SERIAL NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raffleId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "LuckyWinner_pkey" PRIMARY KEY ("winnerId")
);

-- CreateTable
CREATE TABLE "Signatures" (
    "id" SERIAL NOT NULL,
    "signature" TEXT NOT NULL,
    "tncDocVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "referralId" SERIAL NOT NULL,
    "refreeAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("referralId")
);

-- CreateTable
CREATE TABLE "og_nft_users" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "og_nft_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "Raffle_userId_raffleId_key" ON "Raffle"("userId", "raffleId");

-- CreateIndex
CREATE UNIQUE INDEX "LuckyWinner_userId_winnerId_key" ON "LuckyWinner"("userId", "winnerId");

-- CreateIndex
CREATE UNIQUE INDEX "Signatures_userId_tncDocVersion_key" ON "Signatures"("userId", "tncDocVersion");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_refreeAddress_key" ON "Referral"("refreeAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_userId_refreeAddress_key" ON "Referral"("userId", "refreeAddress");

-- CreateIndex
CREATE UNIQUE INDEX "og_nft_users_userId_key" ON "og_nft_users"("userId");

-- AddForeignKey
ALTER TABLE "Raffle" ADD CONSTRAINT "Raffle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LuckyWinner" ADD CONSTRAINT "LuckyWinner_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("raffleId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LuckyWinner" ADD CONSTRAINT "LuckyWinner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signatures" ADD CONSTRAINT "Signatures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "og_nft_users" ADD CONSTRAINT "og_nft_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
