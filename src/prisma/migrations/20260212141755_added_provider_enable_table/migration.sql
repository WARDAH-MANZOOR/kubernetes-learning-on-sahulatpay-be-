-- CreateEnum
CREATE TYPE "public"."CashierMode" AS ENUM ('wordpress', 'shopify');

-- CreateTable
CREATE TABLE "public"."ProviderEnabledStatus" (
    "id" SERIAL NOT NULL,
    "jazzCash" BOOLEAN NOT NULL DEFAULT true,
    "easypaisa" BOOLEAN NOT NULL DEFAULT true,
    "card" BOOLEAN NOT NULL DEFAULT true,
    "qr" BOOLEAN NOT NULL DEFAULT true,
    "mode" "public"."CashierMode"
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderEnabledStatus_id_key" ON "public"."ProviderEnabledStatus"("id");
