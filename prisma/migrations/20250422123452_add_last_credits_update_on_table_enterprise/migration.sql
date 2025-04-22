/*
  Warnings:

  - Added the required column `last_credits_update` to the `enterprises` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "enterprises" ADD COLUMN     "last_credits_update" TIMESTAMP(3) NOT NULL;
