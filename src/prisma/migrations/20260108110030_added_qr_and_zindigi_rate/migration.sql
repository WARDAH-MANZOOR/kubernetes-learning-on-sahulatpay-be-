-- AlterTable
ALTER TABLE "public"."MerchantFinancialTerms" ADD COLUMN     "qrRate" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "zindigiRate" DECIMAL(65,30) DEFAULT 0;
