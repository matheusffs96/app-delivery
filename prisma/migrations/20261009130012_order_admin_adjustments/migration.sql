-- CreateEnum
CREATE TYPE "ManualDiscountType" AS ENUM ('FIXED', 'PERCENT');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "adjustedByUserId" TEXT,
ADD COLUMN     "adjustmentReason" TEXT,
ADD COLUMN     "deliveryFeeWaived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "manualDiscount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "manualDiscountType" "ManualDiscountType",
ADD COLUMN     "manualDiscountValue" DECIMAL(10,2);

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_adjustedByUserId_fkey" FOREIGN KEY ("adjustedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
