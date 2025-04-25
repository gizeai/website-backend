import PostService, { ArtsModelsTypes, TypePostType } from "@/services/PostService";
import UploadService from "@/services/UploadService";
import logger from "@/utils/logger";
import { Upload, User } from "@prisma/client";
import { Request, Response } from "express";
import { TFunction } from "i18next";

type Translaction = TFunction<"translation", undefined>;
async function deleteUploads(t: Translaction, user: User, files: Upload[]) {
  for await (const file of files) {
    await UploadService.delete(t, user, file.id);
  }
}

const PostController = {
  //CREATE ENTERPRISE
  create: async (req: Request, res: Response) => {
    try {
      const enterprise_id = req.body.enterprise_id as string;
      const title = req.body.title as string;
      const description = req.body.description as string;
      const art_model = req.body.art_model as ArtsModelsTypes;
      const type = req.body.type as TypePostType;
      const files = req.uploads;
      const carrousel_count = req.body.carrousel_count as number | undefined;
      const instructions = JSON.parse(req.body.instructions) as {
        description: string;
        fileName: string;
      }[];

      res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      res.write(":\n\n");

      const result = await PostService.create(
        res,
        req.t,
        req.user as User,
        enterprise_id,
        title,
        description,
        art_model,
        type,
        files,
        carrousel_count,
        instructions
      );

      if (!result.success) {
        try {
          if (files) await deleteUploads(req.t, req.user as User, files);
        } catch (error) {
          logger.error(error);
        }

        res.write(
          `data: ${JSON.stringify({
            status: "failed",
            data: {
              message: result.data.error,
            },
          })}\n\n`
        );
        res.end();
        return;
      }
    } catch (error) {
      logger.error(error);

      try {
        if (req.uploads) await deleteUploads(req.t, req.user as User, req.uploads);
      } catch (error) {
        logger.error(error);
      }

      res.write(
        `data: ${JSON.stringify({
          status: "failed",
          data: {
            message: req.t("general_erros.internal_server_error"),
          },
        })}\n\n`
      );
      res.end();
    }
  },
};

export default PostController;
