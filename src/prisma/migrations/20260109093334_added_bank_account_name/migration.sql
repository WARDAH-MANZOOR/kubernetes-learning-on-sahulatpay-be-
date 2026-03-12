-- AlterTable
ALTER TABLE "public"."Merchant" ADD COLUMN     "isAssanpay" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."MerchantFinancialTerms" ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "bankName" TEXT;
