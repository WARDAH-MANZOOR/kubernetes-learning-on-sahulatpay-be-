/*
  Warnings:

  - A unique constraint covering the columns `[mode]` on the table `ProviderEnabledStatus` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ProviderEnabledStatus_mode_key" ON "public"."ProviderEnabledStatus"("mode");
