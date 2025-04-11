/*
  Warnings:

  - A unique constraint covering the columns `[sign_up_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sign_up_id,email]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "users_sign_up_id_key" ON "users"("sign_up_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_sign_up_id_email_key" ON "users"("sign_up_id", "email");
