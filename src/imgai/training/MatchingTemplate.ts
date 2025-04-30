import { Job } from "bull";
import i18next from "@/utils/i18n";
import { NotifyClientData, PostGeneratorOptions } from "../PostGenerator";
import ImgV0 from "./Imgv0/ImgV0";
import prisma from "@/utils/prisma";
import openAiToMyUploadSystem from "@/utils/openAiToMyUploadSystem";
import EnterpriseService from "@/services/EnterpriseService";
import EnterpriseMetrics from "@/managers/EnterpriseMetrics";
import logger from "@/utils/logger";

const MODEL = ImgV0;

export default class MatchingTemplate {
  private job: Job<PostGeneratorOptions>;
  private enterpriseId: string;
  private postID: string;
  static MODEL_VERSION = MODEL.VERSION;
  static MODEL = MODEL;

  constructor(job: Job<PostGeneratorOptions>, postId: string, enterpriseId: string) {
    this.job = job;
    this.postID = postId;
    this.enterpriseId = enterpriseId;
  }

  private async saveInPrismaPost(
    postId: string,
    credits: number,
    attachment: string[],
    body: string,
    tags: string[],
    isVideo: boolean
  ) {
    try {
      const enterprise = await prisma.enterprise.findUnique({
        where: {
          id: this.enterpriseId,
        },
      });

      if (enterprise) {
        const enterpriseMetrics = new EnterpriseMetrics(enterprise);
        enterpriseMetrics.increment({ posts: 1, credits: credits, videos: isVideo ? 1 : 0 });
        await enterpriseMetrics.save();
      }
    } catch (error) {
      logger.error(error);
    }

    await EnterpriseService.reduceCredits(this.enterpriseId, credits);
    await prisma.post.update({
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
      this.job.data.instructions
        .map(instruction => instruction.filePath)
        .filter(a => a !== undefined)
        .filter(a => a.length > 0),
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

      await this.saveInPrismaPost(this.postID, 1, [uploadUrl], description, tags, false);

      notifyClient(jobID, {
        status: "completed",
        data: {
          message: i18next.t("post.prompt_processed"),
          description: description,
          tags: tags,
          images: [uploadUrl],
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

      await this.saveInPrismaPost(
        this.postID,
        images.length,
        uploadImages,
        description,
        tags,
        false
      );

      notifyClient(jobID, {
        status: "completed",
        data: {
          message: i18next.t("post.prompt_processed"),
          description: description,
          tags: tags,
          images: uploadImages,
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

      if (!image) {
        notifyClient(jobID, {
          status: "failed",
          data: {
            message: i18next.t("general_erros.internal_server_error"),
          },
        });
        return;
      }

      const video = await imgmodel.generateVideo(image);

      if (!video) {
        notifyClient(jobID, {
          status: "failed",
          data: {
            message: i18next.t("general_erros.internal_server_error"),
          },
        });
        return;
      }

      const uploadUrl = await openAiToMyUploadSystem(video);

      if (!uploadUrl) {
        notifyClient(jobID, {
          status: "failed",
          data: {
            message: i18next.t("general_erros.internal_server_error"),
          },
        });
        return;
      }

      await this.saveInPrismaPost(this.postID, 2, [uploadUrl], description, tags, false);

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
