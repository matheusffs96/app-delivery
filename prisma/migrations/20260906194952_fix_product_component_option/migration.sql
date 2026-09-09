/*
  Warnings:

  - You are about to drop the column `optionId` on the `ProductComponentOption` table. All the data in the column will be lost.
  - Added the required column `name` to the `ProductComponentOption` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ProductComponentOption` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProductComponentOption" DROP CONSTRAINT "ProductComponentOption_optionId_fkey";

-- DropIndex
DROP INDEX "ProductComponentOption_optionId_idx";

-- AlterTable
ALTER TABLE "ProductComponentOption" DROP COLUMN "optionId",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
