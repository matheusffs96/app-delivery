-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "requiresRedemption" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "redemptionValidityDays" DROP NOT NULL,
ALTER COLUMN "redemptionValidityDays" DROP DEFAULT;
