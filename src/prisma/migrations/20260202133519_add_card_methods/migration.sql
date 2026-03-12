-- CreateEnum
CREATE TYPE "public"."CardMethod" AS ENUM ('JAZZCASH', 'SAFEPAY');

-- AlterTable
ALTER TABLE "public"."Merchant" ADD COLUMN     "cardMethod" "public"."CardMethod" DEFAULT 'JAZZCASH';
