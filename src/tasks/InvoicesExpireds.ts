import logger from "@/utils/logger";
import prisma from "@/utils/prisma";
import cron from "node-cron";

export default function InvoicesExpireds() {
  cron.schedule("0 */1 * * *", async () => {
    try {
      const updates = await prisma.invoice.updateMany({
        where: {
          expireAt: {
            lt: new Date(),
          },
        },
        data: {
          status: "CANCELED",
        },
      });

      console.info(`[InvoicesExpireds] Foram canceladas ${updates.count} faturas expiradas.`);
    } catch (error) {
      logger.error(error);
    }
  });
}
