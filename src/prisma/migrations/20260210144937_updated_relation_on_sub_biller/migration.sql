/*
  Warnings:

  - A unique constraint covering the columns `[merchant_id]` on the table `MerchantSubBillerCode` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Merchant" ADD COLUMN     "billerId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "MerchantSubBillerCode_merchant_id_key" ON "public"."MerchantSubBillerCode"("merchant_id");
