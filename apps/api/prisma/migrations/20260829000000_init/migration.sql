-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('PHOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'REMOVED');

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "type" "CardType" NOT NULL DEFAULT 'PHOTO',
    "title" VARCHAR(200) NOT NULL,
    "text" TEXT NOT NULL,
    "mediaKey" TEXT NOT NULL,
    "status" "CardStatus" NOT NULL DEFAULT 'DRAFT',
    "authorUserId" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllowedUser" (
    "id" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllowedUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemovalRequest" (
    "id" TEXT NOT NULL,
    "cardId" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RemovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaHash" (
    "id" TEXT NOT NULL,
    "phash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'blocked',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaHash_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Card_status_createdAt_idx" ON "Card"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Like_cardId_visitorHash_key" ON "Like"("cardId", "visitorHash");

-- CreateIndex
CREATE UNIQUE INDEX "AllowedUser_telegramUserId_key" ON "AllowedUser"("telegramUserId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaHash_phash_key" ON "MediaHash"("phash");

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
