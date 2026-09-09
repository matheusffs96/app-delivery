-- CreateTable
CREATE TABLE "StorePaymentMethod" (
    "storeId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StorePaymentMethod_pkey" PRIMARY KEY ("storeId","method")
);

-- AddForeignKey
ALTER TABLE "StorePaymentMethod" ADD CONSTRAINT "StorePaymentMethod_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
