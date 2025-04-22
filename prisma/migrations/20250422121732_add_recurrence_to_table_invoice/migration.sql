/*
  Warnings:

  - Added the required column `recurrence` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Recurrence" AS ENUM ('MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "recurrence" "Recurrence" NOT NULL;
