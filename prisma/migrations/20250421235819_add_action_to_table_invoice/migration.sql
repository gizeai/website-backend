/*
  Warnings:

  - Added the required column `action` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InvoiceAction" AS ENUM ('ENTERPRISE_CREATE', 'ENTERPRISE_RENEW', 'PLAN_UPGRADE');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "action" "InvoiceAction" NOT NULL;
