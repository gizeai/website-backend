/*
  Warnings:

  - You are about to drop the column `external_reference` on the `invoices` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "external_reference";

-- CreateTable
CREATE TABLE "invoice_packs" (
    "id" TEXT NOT NULL,
    "invoices" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_packs_pkey" PRIMARY KEY ("id")
);
