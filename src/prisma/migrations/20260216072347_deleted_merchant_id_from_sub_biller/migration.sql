/*
  Warnings:

  - You are about to drop the column `merchant_id` on the `MerchantSubBillerCode` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."MerchantSubBillerCode" DROP CONSTRAINT "MerchantSubBillerCode_merchant_id_fkey";

-- DropIndex
DROP INDEX "public"."MerchantSubBillerCode_merchant_id_key";

-- AlterTable
ALTER TABLE "public"."MerchantSubBillerCode" DROP COLUMN "merchant_id";
