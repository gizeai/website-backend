import MatchingTemplate from "@/imgai/MatchingTemplate";
import PostGenerator from "@/imgai/PostGenerator";
import isPermission from "@/utils/isPermission";
import prisma from "@/utils/prisma";
import { PostType, Upload, User } from "@prisma/client";
import { Response } from "express";
import { TFunction } from "i18next";

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
    instructions: { description: string; fileName: string }[]
  ) => {
    const postGenerator = new PostGenerator(res);

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

    await prisma.post.create({
      data: {
        artModel: art_model,
        creditsUsed: 0,
        iaModel: MatchingTemplate.MODEL_VERSION,
        promptSent: description,
        title: title,
        type: postType,
        enterprise: { connect: { id: enterprise_id } },
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

    await postGenerator.imagine({
      description: description,
      instructions: imgs,
      type: type,
      carrousel_count: undefined,
      art_model: art_model,
    });

    return {
      success: true,
      status: 202,
      data: { created: true },
    };
  },
};

export default PostService;
