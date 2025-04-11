/*
  Warnings:

  - Added the required column `sign_up_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "sign_up_id" TEXT NOT NULL;
