/*
  Warnings:

  - The required column `external_reference` was added to the `invoices` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "external_reference" TEXT NOT NULL;
