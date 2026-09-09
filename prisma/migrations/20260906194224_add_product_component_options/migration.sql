/*
  Warnings:

  - You are about to drop the column `quantity` on the `ProductComponentGroupItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Option" ALTER COLUMN "price" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "ProductComponentGroupItem" DROP COLUMN "quantity";

-- CreateTable
CREATE TABLE "ProductComponentOption" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "additionalPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductComponentOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductComponentOption_groupId_idx" ON "ProductComponentOption"("groupId");

-- CreateIndex
CREATE INDEX "ProductComponentOption_optionId_idx" ON "ProductComponentOption"("optionId");

-- CreateIndex
CREATE INDEX "Option_optionGroupId_idx" ON "Option"("optionGroupId");

-- CreateIndex
CREATE INDEX "OptionGroup_productId_idx" ON "OptionGroup"("productId");

-- AddForeignKey
ALTER TABLE "ProductComponentOption" ADD CONSTRAINT "ProductComponentOption_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ProductComponentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductComponentOption" ADD CONSTRAINT "ProductComponentOption_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE CASCADE ON UPDATE CASCADE;
