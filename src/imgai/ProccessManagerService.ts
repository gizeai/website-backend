const MAX_QUEUE_PROCCESSING_NUMBER = Number(process.env.MAX_QUEUE_PROCCESSING);
let BASE_TIME_PROCESSING = 0;
const processingTimes: number[] = [];
const MAX_SAMPLES = 10;

export default class ProccessManagerService {
  private start?: number;
  private end?: number;
  static MAX_QUEUE_PROCCESSING = MAX_QUEUE_PROCCESSING_NUMBER;

  static GET_BASE_TIME_PROCESSING() {
    return BASE_TIME_PROCESSING;
  }

  startProcessing() {
    this.start = Date.now();
  }

  endProcessing() {
    if (this.start) {
      this.end = Date.now();
      const duration = this.end - (this.start as number);
      processingTimes.push(duration);
      if (processingTimes.length > MAX_SAMPLES) {
        processingTimes.shift();
      }

      BASE_TIME_PROCESSING =
        processingTimes.reduce((sum, t) => sum + t, 0) / processingTimes.length;
    }
  }

  getAverageProcessingTime() {
    return BASE_TIME_PROCESSING;
  }

  getQueueMaxProcessingCount() {
    return MAX_QUEUE_PROCCESSING_NUMBER;
  }
}
