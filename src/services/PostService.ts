import MatchingTemplate from "@/imgai/training/MatchingTemplate";
import PostGenerator from "@/imgai/PostGenerator";
import isPermission from "@/utils/isPermission";
import prisma from "@/utils/prisma";
import { Enterprise, PostType, Upload, User } from "@prisma/client";
import { Response } from "express";
import { TFunction } from "i18next";
import UploadService from "./UploadService";
import EnterpriseService from "./EnterpriseService";
import EnterpriseMetrics from "@/managers/EnterpriseMetrics";
import logger from "@/utils/logger";

type Translaction = TFunction<"translation", undefined>;
export type ArtsModelsTypes = "art" | "ghibi" | "animation" | "realistic";
export type TypePostType = "image" | "video" | "carrousel";

const PostService = {
  create: async (
    res: Response,
    t: Translaction,
    user: User,
    enterprise_id: string,
    title: string,
    description: string,
    art_model: ArtsModelsTypes,
    type: TypePostType,
    files: Upload[] | undefined,
    carrousel_count: number | undefined,
    instructions: { description: string; fileName?: string }[]
  ) => {
    if (files?.length === instructions.length) {
      const instructiosnFilesName = instructions
        .map(instruction => instruction.fileName)
        .filter(i => i !== undefined);

      for (const file of files) {
        if (!instructiosnFilesName.includes(file.originalName)) {
          return {
            success: false,
            status: 400,
            data: { error: t("post.invalid_file_instructions", { name: file.originalName }) },
          };
        }
      }
    }

    const postGenerator = new PostGenerator(res, false);

    const enterprise = await prisma.enterprise.findUnique({
      where: {
        id: enterprise_id,
        active: true,
      },
    });

    if (!enterprise) {
      return {
        success: false,
        status: 404,
        data: { error: t("enterprise.not_found") },
      };
    }

    if (!user) {
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.not_permission_to_action") },
      };
    }

    if (!(await isPermission(enterprise, user).isUser())) {
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.not_permission_to_action") },
      };
    }

    let postType: PostType = "IMAGE";

    switch (type) {
      case "image":
        postType = "IMAGE";
        break;
      case "video":
        postType = "VIDEO";
        break;
      case "carrousel":
        postType = "CARROUSEL";
        break;
    }

    const post = await prisma.post.create({
      data: {
        artModel: art_model,
        creditsUsed: 0,
        iaModel: MatchingTemplate.MODEL_VERSION,
        promptSent: description,
        instructions: JSON.stringify(instructions),
        title: title,
        type: postType,
        enterprise: { connect: { id: enterprise.id } },
      },
    });

    const imgs = instructions
      .map(instruction => {
        const fileUrl = files?.find(file => file.originalName === instruction.fileName);

        return {
          description: instruction.description,
          filePath: fileUrl?.storedLocation || "",
        };
      })
      .filter(instruction => instruction.filePath.length > 0);

    const { jobId } = await postGenerator.imagine({
      postId: post.id,
      description: description,
      instructions: imgs,
      type: type,
      carrousel_count: carrousel_count,
      art_model: art_model,
      enterpriseId: enterprise.id,
    });

    return {
      success: true,
      status: 202,
      data: { job: jobId },
    };
  },

  stream: async (res: Response, jobid: string) => {
    const postGenerator = new PostGenerator(res, true);

    try {
      await postGenerator.stream(jobid);

      return {
        success: true,
        status: 202,
        data: { created: true },
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          status: 404,
          data: { error: error.message },
        };
      }

      throw error;
    }
  },

  get: async (t: Translaction, enterpriseId: string) => {
    const posts = await prisma.post.findMany({
      where: {
        enterpriseId: enterpriseId,
      },
    });

    return {
      success: true,
      status: 200,
      data: posts,
    };
  },

  studio: async (
    t: Translaction,
    res: Response,
    enterprise: Enterprise,
    postId: string,
    postIndex: number,
    mask: Upload
  ) => {
    const postGenerator = new PostGenerator(res, false);

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
        enterpriseId: enterprise.id,
      },
    });

    if (!post) {
      return {
        success: false,
        status: 404,
        data: { error: t("post.not_found") },
      };
    }

    const attachment = post.responseAttachment?.[postIndex];

    if (!attachment) {
      return {
        success: false,
        status: 404,
        data: { error: t("post.attachment_not_found") },
      };
    }

    const explode = attachment.split("/");
    const uploadId = explode[explode.length - 1];

    const upload = await UploadService.getUploadPrisma(t, uploadId);

    if (!upload.success) {
      return upload;
    }

    const uploadData = upload.data as Upload;
    const response = await postGenerator.studio(postId, uploadData, mask);

    if (!response) {
      return {
        success: false,
        status: 500,
        data: { error: t("general_erros.internal_server_error") },
      };
    }

    const newAttachment = [...(post.responseAttachment ?? [])];
    newAttachment[postIndex] = response;

    try {
      if (enterprise) {
        const enterpriseMetrics = new EnterpriseMetrics(enterprise);
        enterpriseMetrics.increment({ credits: 1, edits: 1 });
        await enterpriseMetrics.save();
      }
    } catch (error) {
      logger.error(error);
    }

    await EnterpriseService.reduceCredits(enterprise.id, 1);
    await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        responseAttachment: newAttachment,
        edits: {
          increment: 1,
        },
        creditsUsed: {
          increment: 1,
        },
      },
    });

    return {
      success: true,
      status: 200,
      data: {
        url: response,
      },
    };
  },
};

export default PostService;
