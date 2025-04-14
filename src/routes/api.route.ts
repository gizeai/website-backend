import logger from "@/utils/logger";
import prisma from "@/utils/prisma";
import { Router } from "express";

const apiRouter = Router();

apiRouter.get("/", async (req, res) => {
  try {
    async function getLatence() {
      const start = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      const latency = performance.now() - start;

      return Number(latency.toFixed(4));
    }

    const nodeVersion = process.version;
    const updateAt = new Date().toISOString();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const uptime = process.uptime();

    const maxConnections: { setting: string }[] =
      await prisma.$queryRaw`SELECT setting FROM pg_settings WHERE name = 'max_connections'`;

    const openConnections: { count: string }[] = await prisma.$queryRaw`SELECT COUNT(*)
FROM pg_stat_activity WHERE backend_type = 'client backend';`;

    const dbVersion: { version: string }[] = await prisma.$queryRaw`SELECT version()`;

    res.json({
      update_at: updateAt,
      dependencies: {
        database: {
          db: "postgres",
          version: dbVersion?.[0].version,
          max_connections: Number(maxConnections?.[0].setting.toString()),
          opened_connections: Number(openConnections?.[0].count.toString()),
          latency: {
            first_query: await getLatence(),
            second_query: await getLatence(),
            third_query: await getLatence(),
          },
        },
      },
      webserver: {
        status: "healthy",
        node_version: nodeVersion,
        timezone: timezone,
        uptime: uptime,
      },
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: req.t("general_erros.internal_server_error") });
  } finally {
    await prisma.$disconnect();
  }

  return;
});

export default {
  path: "/",
  router: apiRouter,
};
