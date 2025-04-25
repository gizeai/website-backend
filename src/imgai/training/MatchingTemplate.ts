import { Job } from "bull";
import i18next from "@/utils/i18n";
import { NotifyClientData, PostGeneratorOptions } from "../PostGenerator";
import ImgV0 from "./Imgv0/ImgV0";

const MODEL = ImgV0;

export default class MatchingTemplate {
  private job: Job<PostGeneratorOptions>;
  static MODEL_VERSION = MODEL.VERSION;

  constructor(job: Job<PostGeneratorOptions>) {
    this.job = job;
  }

  async proccess(notifyClient: (jobId: string, data: NotifyClientData) => void) {
    const imgmodel = new MODEL();
    const jobID = this.job.id.toString();

    notifyClient(jobID, {
      status: "processing",
      data: {
        message: i18next.t("post.processing_legend"),
      },
    });

    const description = await imgmodel.generateDescription(
      this.job.data.instructions.map(instruction => instruction.filePath),
      this.job.data.description,
      this.job.data.type
    );

    notifyClient(jobID, {
      status: "processing",
      data: {
        message: i18next.t("post.processing_tags"),
      },
    });

    const tags = await imgmodel.generateTags(this.job.data.description, this.job.data.type);

    if (this.job.data.type === "image") {
      notifyClient(jobID, {
        status: "processing",
        data: {
          message: i18next.t("post.processing_image"),
        },
      });

      const image = await imgmodel.generateImage(
        this.job.data.instructions,
        this.job.data.art_model
      );

      notifyClient(jobID, {
        status: "completed",
        data: {
          message: i18next.t("post.prompt_processed"),
          description: description,
          tags: tags,
          images: [image],
        },
      });
    } else if (this.job.data.type === "carrousel") {
      notifyClient(jobID, {
        status: "processing",
        data: {
          message: i18next.t("post.processing_carousel"),
        },
      });

      const carouselCount = this.job.data.carrousel_count ?? 1;

      const images = await Promise.all(
        Array.from({ length: carouselCount }, async () => {
          const img = await imgmodel.generateImage(
            this.job.data.instructions,
            this.job.data.art_model
          );
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
    } else if (this.job.data.type === "video") {
      notifyClient(jobID, {
        status: "processing",
        data: {
          message: i18next.t("post.processing_video"),
        },
      });

      const image = await imgmodel.generateImage(
        this.job.data.instructions,
        this.job.data.art_model
      );

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
      throw new Error(`Invalid type ${this.job.data.type}`);
    }
  }
}
