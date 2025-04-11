/*
  Warnings:

  - Added the required column `signature` to the `sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "signature" TEXT NOT NULL;
