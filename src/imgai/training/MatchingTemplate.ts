import { Job } from "bull";
import i18next from "@/utils/i18n";
import { NotifyClientData, PostGeneratorOptions } from "../PostGenerator";
import ImgV0 from "./Imgv0/ImgV0";
import prisma from "@/utils/prisma";
import openAiToMyUploadSystem from "@/utils/openAiToMyUploadSystem";

const MODEL = ImgV0;

export default class MatchingTemplate {
  private job: Job<PostGeneratorOptions>;
  private postID: string;
  static MODEL_VERSION = MODEL.VERSION;

  constructor(job: Job<PostGeneratorOptions>, postId: string) {
    this.job = job;
    this.postID = postId;
  }

  private saveInPrismaPost(
    postId: string,
    credits: number,
    attachment: string[],
    body: string,
    tags: string[]
  ) {
    return prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        creditsUsed: credits,
        responseAttachment: attachment,
        responseBody: body,
        responseTags: tags,
      },
    });
  }

  async proccess(notifyClient: (jobId: string, data: NotifyClientData) => void) {
    const post = await prisma.post.findUnique({
      where: {
        id: this.postID,
      },
    });

    if (!post) {
      throw new Error("Post not found");
    }

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

      if (!image) {
        notifyClient(jobID, {
          status: "failed",
          data: {
            message: i18next.t("general_erros.internal_server_error"),
          },
        });
        return;
      }

      const uploadUrl = await openAiToMyUploadSystem(image);

      if (!uploadUrl) {
        notifyClient(jobID, {
          status: "failed",
          data: {
            message: i18next.t("general_erros.internal_server_error"),
          },
        });
        return;
      }

      await this.saveInPrismaPost(this.postID, 1, [uploadUrl], description, tags);

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

      const imagesNotUndefined = images.filter(image => image !== undefined);

      if (imagesNotUndefined.length === 0) {
        notifyClient(jobID, {
          status: "failed",
          data: {
            message: i18next.t("general_erros.internal_server_error"),
          },
        });
        return;
      }

      const uploadImages: string[] = [];

      for await (const image of imagesNotUndefined) {
        const uploadUrl = await openAiToMyUploadSystem(image);

        if (uploadUrl) {
          uploadImages.push(uploadUrl);
        }
      }

      if (uploadImages.length === 0) {
        notifyClient(jobID, {
          status: "failed",
          data: {
            message: i18next.t("general_erros.internal_server_error"),
          },
        });
        return;
      }

      await this.saveInPrismaPost(this.postID, images.length, uploadImages, description, tags);

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

      //TODO: Usar o saveInPrismaPost

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
