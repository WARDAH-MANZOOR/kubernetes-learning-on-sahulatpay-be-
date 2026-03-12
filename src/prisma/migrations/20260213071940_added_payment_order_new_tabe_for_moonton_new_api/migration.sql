-- CreateTable
CREATE TABLE "public"."PaymentOrderNew" (
    "id" TEXT NOT NULL,
    "merchantOrderId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "countryOrRegion" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "returnUrl" TEXT NOT NULL,
    "notifyUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'init',
    "successTime" TIMESTAMP(3),
    "merchantId" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "userIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentOrderNew_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrderNew_merchantOrderId_key" ON "public"."PaymentOrderNew"("merchantOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrderNew_invoiceId_key" ON "public"."PaymentOrderNew"("invoiceId");
