import { Response } from "express";
import QueueService from "./QueueService";
import { Queue } from "bull";
import i18next from "@/utils/i18n";
import ProccessManagerService from "./ProccessManagerService";
import queueUtils from "./queueUtils";
import { Upload } from "@prisma/client";
import MatchingTemplate from "./training/MatchingTemplate";
import UploadService from "@/services/UploadService";

const clients = new Map<string, Response>();

export interface PostGeneratorOptions {
  postId: string;
  enterpriseId: string;
  description: string;
  type: "image" | "video" | "carrousel";
  carrousel_count?: number;
  art_model: string;
  instructions: { description: string; filePath?: string }[];
}

export interface NotifyData {
  message: string;
  description?: string;
  tags?: string[];
  images?: (string | undefined)[];
}

export interface NotifyClientData {
  status: "completed" | "failed" | "processing" | "ping" | "queued";
  data?: NotifyData;
}

export default class PostGenerator {
  private res: Response;
  private queue: Queue<PostGeneratorOptions>;

  constructor(res: Response, streamViewer: boolean) {
    this.res = res;
    this.queue = QueueService(this.notifyClient, !streamViewer);
  }

  private notifyClient(jobId: string, data: NotifyClientData) {
    const client = clients.get(jobId);
    if (client && client.destroyed === false) {
      client.write(`data: ${JSON.stringify(data)}\n\n`);
      if (data.status === "completed" || data.status === "failed") {
        client.end();
        clients.delete(jobId);
      }
    }
  }

  async stream(jobid: string) {
    const job = await this.queue.getJob(jobid);

    if (!job) {
      throw new Error(i18next.t("post.job_not_found"));
    }

    if (job.finishedOn) {
      throw new Error(i18next.t("post.job_not_found"));
    }

    clients.set(job.id.toString(), this.res);

    const activeJobs = await this.queue.getActiveCount();

    if (activeJobs >= ProccessManagerService.MAX_QUEUE_PROCCESSING) {
      const queuePosition = await queueUtils.getQueuePosition(this.queue, job.id.toString());
      const estimatedTime = await queueUtils.getEstimatedWaitTime(
        this.queue,
        ProccessManagerService.GET_BASE_TIME_PROCESSING()
      );

      this.notifyClient(job.id.toString(), {
        status: "queued",
        data: {
          message: i18next.t("post.in_queue", { position: queuePosition, time: estimatedTime }),
        },
      });
    }

    this.res.on("close", () => {
      clients.delete(job.id.toString());
      this.res.end();
    });
  }

  async imagine(options: PostGeneratorOptions) {
    const job = await this.queue.add(options);

    return {
      jobId: job.id.toString(),
    };
  }

  async studio(prompt: string, file: Upload, mask: Upload) {
    const model = new MatchingTemplate.MODEL();
    const fileFs = await UploadService.download(file.storedLocation, "external-uploads");
    const maskFs = await UploadService.download(mask.storedLocation, "external-uploads");

    if (!fileFs.data?.file || !maskFs.data?.file) {
      throw new Error(i18next.t("post.file_not_found"));
    }

    return await model.studioEdit(prompt, fileFs.data.file, maskFs.data.file);
  }
}
