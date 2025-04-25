import Queue from "bull";
import { Response } from "express";
import OpenAI from "openai";
import imgAiGenerateDescription from "./imgAiGenerateDescription";
import imgAiGenerateTags from "./imgAiGenerateTags";
import imgAiGenerateImage from "./imgAiGenerateImage";
import i18next from "@/utils/i18n";
import logger from "@/utils/logger";
import getRandomOpenAIApiKey from "@/utils/getRandomOpenAIApiKey";
import queueUtils from "./queueUtils";

export interface NotifyData {
  message: string;
  description?: string;
  tags?: string[];
  images?: (string | undefined)[];
}

interface Options {
  description: string;
  type: "image" | "video" | "carrousel";
  carrousel_count?: number;
  art_model: string;
  instructions: { description: string; filePath: string }[];
}

const MAX_QUEUE_PROCCESSING = Number(process.env.MAX_QUEUE_PROCCESSING);
let BASE_TIME_PROCESSING = 0;
const processingTimes: number[] = [];
const MAX_SAMPLES = 10;

const clients = new Map<string, Response>();
const imageQueue = Queue<Options>("image-generation", {
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === "true" ? {} : undefined,
  },
});

function notifyClient(
  jobId: string,
  data: { status: "completed" | "failed" | "processing" | "ping" | "queued"; data?: NotifyData }
) {
  const client = clients.get(jobId);
  if (client) {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
    if (data.status === "completed" || data.status === "failed") {
      client.end();
      clients.delete(jobId);
    }
  }
}

imageQueue.process(MAX_QUEUE_PROCCESSING, async job => {
  const time1 = Date.now();
  const openai = new OpenAI({ apiKey: getRandomOpenAIApiKey() });

  const jobID = job.id.toString();

  const interval = setInterval(() => notifyClient(jobID, { status: "ping" }), 10000);

  const timeout = setTimeout(() => {
    throw new Error("Job timeout");
  }, 240000);

  try {
    notifyClient(jobID, {
      status: "processing",
      data: {
        message: i18next.t("post.processing_legend"),
      },
    });

    const { description } = await imgAiGenerateDescription(
      openai,
      job.data.instructions.map(instruction => instruction.filePath),
      job.data.description,
      job.data.type
    );

    notifyClient(jobID, {
      status: "processing",
      data: {
        message: i18next.t("post.processing_tags"),
      },
    });

    const { tags } = await imgAiGenerateTags(openai, job.data.description, job.data.type);

    if (job.data.type === "image") {
      notifyClient(jobID, {
        status: "processing",
        data: {
          message: i18next.t("post.processing_image"),
        },
      });

      const image = await imgAiGenerateImage(openai, job.data.instructions, job.data.art_model);

      notifyClient(jobID, {
        status: "completed",
        data: {
          message: i18next.t("post.prompt_processed"),
          description: description,
          tags: tags,
          images: [image],
        },
      });
    } else if (job.data.type === "carrousel") {
      notifyClient(jobID, {
        status: "processing",
        data: {
          message: i18next.t("post.processing_carousel"),
        },
      });

      const carouselCount = job.data.carrousel_count ?? 1;

      const images = await Promise.all(
        Array.from({ length: carouselCount }, async () => {
          const img = await imgAiGenerateImage(openai, job.data.instructions, job.data.art_model);
          return img;
        })
      ).then(results => results.filter(Boolean));

      notifyClient(jobID, {
        status: "completed",
        data: {
          message: i18next.t("post.prompt_processed"),
          description: description,
          tags: tags,
          images: images,
        },
      });
    } else if (job.data.type === "video") {
      notifyClient(jobID, {
        status: "processing",
        data: {
          message: i18next.t("post.processing_video"),
        },
      });

      const image = await imgAiGenerateImage(openai, job.data.instructions, job.data.art_model);

      //TODO: Criar um vídeo com a imagem gerada.
      const video = image;

      notifyClient(jobID, {
        status: "completed",
        data: {
          message: i18next.t("post.prompt_processed"),
          description: description,
          tags: tags,
          images: [video],
        },
      });
    } else {
      throw new Error(`Invalid type ${job.data.type}`);
    }

    const time2 = Date.now();

    const duration = time2 - time1;
    processingTimes.push(duration);
    if (processingTimes.length > MAX_SAMPLES) {
      processingTimes.shift();
    }

    BASE_TIME_PROCESSING = processingTimes.reduce((sum, t) => sum + t, 0) / processingTimes.length;
  } catch (error) {
    logger.error({ error, jobId: job.id, options: job.data }, "Failed to process image generation");
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

imageQueue.on("completed", () => {
  queueUtils.updateQueuePositions(imageQueue, BASE_TIME_PROCESSING, notifyClient);
});

imageQueue.on("failed", (job, err) => {
  if (err.message.includes("429")) {
    logger.error({ jobId: job.id }, "Rate limit hit, retrying job");
    job.retry();
  }

  queueUtils.updateQueuePositions(imageQueue, BASE_TIME_PROCESSING, notifyClient);
});

export default function ImgAI(res: Response) {
  async function imagine(options: Options) {
    const job = await imageQueue.add(options);
    clients.set(job.id.toString(), res);

    const activeJobs = await imageQueue.getActiveCount();

    if (activeJobs >= MAX_QUEUE_PROCCESSING) {
      const queuePosition = await queueUtils.getQueuePosition(imageQueue, job.id.toString());
      const estimatedTime = await queueUtils.getEstimatedWaitTime(imageQueue, BASE_TIME_PROCESSING);
      notifyClient(job.id.toString(), {
        status: "queued",
        data: {
          message: i18next.t("post.in_queue", { position: queuePosition, time: estimatedTime }),
        },
      });
    }

    res.on("close", () => {
      clients.delete(job.id.toString());
      res.end();
    });
  }

  return {
    imagine,
    model: "img-v0",
  };
}
