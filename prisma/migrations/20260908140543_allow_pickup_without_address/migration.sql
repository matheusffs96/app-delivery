-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_addressId_fkey";

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "addressId" DROP NOT NULL,
ALTER COLUMN "deliveryStreet" DROP NOT NULL,
ALTER COLUMN "deliveryNumber" DROP NOT NULL,
ALTER COLUMN "deliveryNeighborhood" DROP NOT NULL,
ALTER COLUMN "deliveryCity" DROP NOT NULL,
ALTER COLUMN "deliveryState" DROP NOT NULL,
ALTER COLUMN "deliveryZipCode" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
