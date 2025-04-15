/*
  Warnings:

  - The `response_attachment` column on the `posts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `credits_used` to the `posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ia_model` to the `posts` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `posts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('IMAGE', 'VIDEO', 'CARROUSEL');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "credits_used" INTEGER NOT NULL,
ADD COLUMN     "edits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ia_model" TEXT NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "PostType" NOT NULL,
DROP COLUMN "response_attachment",
ADD COLUMN     "response_attachment" TEXT[];
