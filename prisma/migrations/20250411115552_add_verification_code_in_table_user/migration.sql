/*
  Warnings:

  - Added the required column `verification_code` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "verification_code" TEXT NOT NULL;
