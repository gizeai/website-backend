import logger from "@/utils/logger";
import prisma from "@/utils/prisma";
import cron from "node-cron";

export default function DeleteIncompletePosts() {
  cron.schedule("0 */3 * * *", async () => {
    try {
      await prisma.post.deleteMany({
        where: {
          responseBody: null,
          responseAttachment: {
            isEmpty: true,
          },
          responseTags: {
            isEmpty: true,
          },
          createdAt: {
            lt: new Date(Date.now() - 1000 * 60 * 60 * 3),
          },
        },
      });
    } catch (error) {
      logger.error(error);
    }
  });
}
