/*
  Warnings:

  - You are about to drop the column `couponCode` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Promotion` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cpf]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Promotion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Promotion` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Promotion_couponCode_key";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "cpf" TEXT,
ALTER COLUMN "phone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Promotion" DROP COLUMN "couponCode",
DROP COLUMN "type",
DROP COLUMN "value",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "discountFixed" DECIMAL(10,2),
ADD COLUMN     "discountPercentage" DECIMAL(5,2),
ADD COLUMN     "freeDelivery" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "redemptionValidityDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "slug" TEXT NOT NULL;

-- DropEnum
DROP TYPE "PromotionType";

-- CreateTable
CREATE TABLE "PromotionPaymentMethod" (
    "promotionId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,

    CONSTRAINT "PromotionPaymentMethod_pkey" PRIMARY KEY ("promotionId","method")
);

-- CreateTable
CREATE TABLE "PromotionRedemption" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "orderId" TEXT,

    CONSTRAINT "PromotionRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromotionRedemption_code_key" ON "PromotionRedemption"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionRedemption_orderId_key" ON "PromotionRedemption"("orderId");

-- CreateIndex
CREATE INDEX "PromotionRedemption_code_idx" ON "PromotionRedemption"("code");

-- CreateIndex
CREATE INDEX "PromotionRedemption_customerId_idx" ON "PromotionRedemption"("customerId");

-- CreateIndex
CREATE INDEX "PromotionRedemption_expiresAt_idx" ON "PromotionRedemption"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionRedemption_promotionId_customerId_key" ON "PromotionRedemption"("promotionId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_cpf_key" ON "Customer"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_slug_key" ON "Promotion"("slug");

-- AddForeignKey
ALTER TABLE "PromotionPaymentMethod" ADD CONSTRAINT "PromotionPaymentMethod_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
