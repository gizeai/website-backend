import Queue from "bull";
import { NotifyClientData, PostGeneratorOptions } from "./PostGenerator";
import queueUtils from "./queueUtils";
import logger from "@/utils/logger";
import i18next from "@/utils/i18n";
import ProccessManagerService from "./ProccessManagerService";
import MatchingTemplate from "./training/MatchingTemplate";

const imageQueue = Queue<PostGeneratorOptions>("image-generation", {
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === "true" ? {} : undefined,
  },
});

export default function QueueService(
  notifyClient: (jobId: string, data: NotifyClientData) => void
) {
  const proccessManagerService = new ProccessManagerService();

  imageQueue.on("completed", () => {
    queueUtils.updateQueuePositions(
      imageQueue,
      proccessManagerService.getQueueMaxProcessingCount(),
      notifyClient
    );
  });

  imageQueue.on("failed", (job, err) => {
    if (err.message.includes("429")) {
      logger.error({ jobId: job.id }, "Rate limit hit, retrying job");
      job.retry();
    }

    queueUtils.updateQueuePositions(
      imageQueue,
      proccessManagerService.getQueueMaxProcessingCount(),
      notifyClient
    );
  });

  imageQueue.process(ProccessManagerService.MAX_QUEUE_PROCCESSING, async job => {
    const jobID = job.id.toString();
    const interval = setInterval(() => notifyClient(jobID, { status: "ping" }), 10000);

    const timeout = setTimeout(() => {
      throw new Error("Job timeout");
    }, 240000);

    try {
      proccessManagerService.startProcessing();
      const matchingTemplate = new MatchingTemplate(job);
      await matchingTemplate.proccess(notifyClient);
      proccessManagerService.endProcessing();
    } catch (error) {
      logger.error(
        { error, jobId: job.id, options: job.data },
        "Failed to process image generation"
      );
      notifyClient(jobID, {
        status: "failed",
        data: {
          message: i18next.t("general_erros.internal_server_error"),
        },
      });
    } finally {
      clearInterval(interval);
      clearTimeout(timeout);
    }
  });

  return imageQueue;
}
