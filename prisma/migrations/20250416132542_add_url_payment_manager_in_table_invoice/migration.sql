-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "payment_url" TEXT,
ADD COLUMN     "payment_url_expire" TIMESTAMP(3);
