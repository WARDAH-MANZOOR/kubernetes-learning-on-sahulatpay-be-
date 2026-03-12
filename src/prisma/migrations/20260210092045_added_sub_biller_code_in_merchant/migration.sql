-- CreateTable
CREATE TABLE "public"."MerchantSubBillerCode" (
    "id" SERIAL NOT NULL,
    "merchant_id" INTEGER NOT NULL,
    "biller_code" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantSubBillerCode_id_key" ON "public"."MerchantSubBillerCode"("id");

-- AddForeignKey
ALTER TABLE "public"."MerchantSubBillerCode" ADD CONSTRAINT "MerchantSubBillerCode_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."Merchant"("merchant_id") ON DELETE RESTRICT ON UPDATE CASCADE;
