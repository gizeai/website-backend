import UploadService from "@/services/UploadService";
import errorToString from "@/utils/errorToString";
import logger from "@/utils/logger";
import { User } from "@prisma/client";
import { Request, Response } from "express";

const UploadController = {
  //GET FILE
  getFile: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const download = req.query.download;

      const result = await UploadService.get(req.t, id, "external-uploads");

      if (!result.success) {
        res.status(result.status).json(result.data);
        return;
      }

      const file = result.data.file as Blob;
      const fileName = result.data.fileName as string;
      const mimeType = result.data.mimeType as string;
      const size = result.data.size as number;

      let contentDisposition = "inline; filename=";
      if (download === "true") contentDisposition = "attachment; filename=";

      res
        .status(result.status)
        .header("Content-Type", mimeType)
        .header("Content-Length", size.toString())
        .header("Content-Disposition", contentDisposition + fileName)
        .send(file);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: errorToString(error) });
    }
  },

  //DELETE FILE
  deleteFile: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;

      const result = await UploadService.delete(req.t, req.user as User, id, "external-uploads");

      if (!result.success) {
        res.status(result.status).json(result.data);
        return;
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: errorToString(error) });
    }
  },
};

export default UploadController;
