-- CreateTable
CREATE TABLE "public"."WhiteListMerchant" (
    "id" SERIAL NOT NULL,
    "merchantId" INTEGER NOT NULL,
    "merchant_name" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ips" JSONB,

    CONSTRAINT "WhiteListMerchant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhiteListMerchant_merchantId_key" ON "public"."WhiteListMerchant"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteListMerchant_token_key" ON "public"."WhiteListMerchant"("token");

-- AddForeignKey
ALTER TABLE "public"."WhiteListMerchant" ADD CONSTRAINT "WhiteListMerchant_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "public"."Merchant"("merchant_id") ON DELETE RESTRICT ON UPDATE CASCADE;
