import EnterpriseService from "@/services/EnterpriseService";
import PostService, { ArtsModelsTypes, TypePostType } from "@/services/PostService";
import UploadService from "@/services/UploadService";
import isPermission from "@/utils/isPermission";
import logger from "@/utils/logger";
import { Enterprise, Upload, User } from "@prisma/client";
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
      const enterprise_id = req.params.enterprise as string;
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

      const enterprise = await EnterpriseService.get(req.t, enterprise_id);

      if (!enterprise.success) {
        if (files) await deleteUploads(req.t, req.user as User, files);
        res.status(enterprise.status).json(enterprise.data);
        return;
      }

      if (!(await isPermission(enterprise.data as Enterprise, req.user as User).isUser())) {
        if (files) await deleteUploads(req.t, req.user as User, files);
        res.status(401).json(req.t("general_erros.not_permission_to_action"));
        return;
      }

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
        res.status(result.status).json(result.data);
        return;
      }

      res.status(201).json(result.data);
      return;
    } catch (error) {
      logger.error(error);

      try {
        if (req.uploads) await deleteUploads(req.t, req.user as User, req.uploads);
      } catch (error) {
        logger.error(error);
      }

      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },

  stream: async (req: Request, res: Response) => {
    try {
      const enterprise_id = req.params.enterprise as string;
      const job_id = req.params.job as string;

      res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      res.write(":\n\n");

      const enterprise = await EnterpriseService.get(req.t, enterprise_id);

      if (!enterprise.success) {
        res.write(
          `data: ${JSON.stringify({
            status: "failed",
            data: {
              message: (enterprise.data as { error: string }).error,
            },
          })}\n\n`
        );
        res.end();
        return;
      }

      if (!(await isPermission(enterprise.data as Enterprise, req.user as User).isUser())) {
        res.write(
          `data: ${JSON.stringify({
            status: "failed",
            data: {
              message: req.t("general_erros.not_permission_to_action"),
            },
          })}\n\n`
        );
        res.end();
        return;
      }

      const result = await PostService.stream(res, req.t, req.user as User, enterprise_id, job_id);

      if (!result.success) {
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

  // GET POSTS
  get: async (req: Request, res: Response) => {
    try {
      const enterprise_id = req.params.enterprise as string;
      const enterprise = await EnterpriseService.get(req.t, enterprise_id);

      if (!enterprise.success) {
        res.status(enterprise.status).json(enterprise.data);
        return;
      }

      if (!(await isPermission(enterprise.data as Enterprise, req.user as User).isUser())) {
        res.status(enterprise.status).json(req.t("general_erros.not_permission_to_action"));
        return;
      }

      const result = await PostService.get(req.t, enterprise_id);

      if (!result.success) {
        res.status(result.status).json(result.data);
        return;
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },
};

export default PostController;
