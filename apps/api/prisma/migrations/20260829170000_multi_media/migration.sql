-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "type" "CardType" NOT NULL,
    "mediaKey" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- Migrate existing cards' single media into Media
INSERT INTO "Media" ("id", "cardId", "type", "mediaKey", "sort", "createdAt")
SELECT gen_random_uuid()::text, "id", "type", "mediaKey", 0, "createdAt"
FROM "Card";

-- CreateIndex
CREATE INDEX "Media_cardId_sort_idx" ON "Media"("cardId", "sort");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old single-media columns
ALTER TABLE "Card" DROP COLUMN "type";
ALTER TABLE "Card" DROP COLUMN "mediaKey";
