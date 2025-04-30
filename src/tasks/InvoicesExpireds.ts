import logger from "@/utils/logger";
import prisma from "@/utils/prisma";
import cron from "node-cron";

export default function InvoicesExpireds() {
  cron.schedule("0 */1 * * *", async () => {
    try {
      await prisma.invoice.updateMany({
        where: {
          expireAt: {
            lt: new Date(),
          },
        },
        data: {
          status: "CANCELED",
        },
      });
    } catch (error) {
      logger.error(error);
    }
  });
}
