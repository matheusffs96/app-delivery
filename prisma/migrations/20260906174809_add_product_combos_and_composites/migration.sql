-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('SIMPLE', 'COMBO', 'COMPOSITE');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "type" "ProductType" NOT NULL DEFAULT 'SIMPLE';

-- CreateTable
CREATE TABLE "ProductComponentGroup" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "minSelect" INTEGER NOT NULL DEFAULT 0,
    "maxSelect" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductComponentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductComponentGroupItem" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductComponentGroupItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductComboItem" (
    "id" TEXT NOT NULL,
    "comboProductId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductComboItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductComponentGroup_productId_idx" ON "ProductComponentGroup"("productId");

-- CreateIndex
CREATE INDEX "ProductComponentGroupItem_groupId_idx" ON "ProductComponentGroupItem"("groupId");

-- CreateIndex
CREATE INDEX "ProductComponentGroupItem_productId_idx" ON "ProductComponentGroupItem"("productId");

-- CreateIndex
CREATE INDEX "ProductComboItem_comboProductId_idx" ON "ProductComboItem"("comboProductId");

-- CreateIndex
CREATE INDEX "ProductComboItem_productId_idx" ON "ProductComboItem"("productId");

-- AddForeignKey
ALTER TABLE "ProductComponentGroup" ADD CONSTRAINT "ProductComponentGroup_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductComponentGroupItem" ADD CONSTRAINT "ProductComponentGroupItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ProductComponentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductComponentGroupItem" ADD CONSTRAINT "ProductComponentGroupItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductComboItem" ADD CONSTRAINT "ProductComboItem_comboProductId_fkey" FOREIGN KEY ("comboProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductComboItem" ADD CONSTRAINT "ProductComboItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
