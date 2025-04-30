import logger from "@/utils/logger";
import prisma from "@/utils/prisma";
import cron from "node-cron";

export default function DeleteInvalidEnterprises() {
  cron.schedule("0 */6 * * *", async () => {
    try {
      const deleted = await prisma.enterprise.deleteMany({
        where: {
          active: false,
          createdAt: {
            lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
          },
        },
      });

      console.info(
        `[DeleteInvalidEnterprises] Foram deletadas ${deleted.count} empresas inválidas.`
      );
    } catch (error) {
      logger.error(error);
    }
  });
}
