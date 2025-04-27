import { Queue } from "bull";
import i18next from "@/utils/i18n";
import { NotifyData } from "./PostGenerator";

async function getQueuePosition(imageQueue: Queue, jobId: string) {
  const jobs = await imageQueue.getWaiting();
  const jobIndex = jobs.findIndex(job => job.id.toString() === jobId);
  return jobIndex >= 0 ? jobIndex + 1 : 0;
}

async function getEstimatedWaitTime(imageQueue: Queue, avgProcessingTime: number) {
  const waitingJobs = await imageQueue.getWaitingCount();
  return waitingJobs * avgProcessingTime;
}

async function updateQueuePositions(
  imageQueue: Queue,
  avgProcessingTime: number,
  notifyClient: (
    jobId: string,
    data: {
      status: "completed" | "failed" | "processing" | "ping" | "queued";
      data?: NotifyData;
    }
  ) => void
) {
  const waitingJobs = await imageQueue.getWaiting();
  for (const [index, job] of waitingJobs.entries()) {
    const jobId = job.id.toString();
    const estimatedTime = await getEstimatedWaitTime(imageQueue, avgProcessingTime);
    notifyClient(jobId, {
      status: "queued",
      data: {
        message: i18next.t("post.in_queue", { position: index + 1, time: estimatedTime }),
      },
    });
  }
}

const queueUtils = {
  getQueuePosition,
  updateQueuePositions,
  getEstimatedWaitTime,
};

export default queueUtils;
