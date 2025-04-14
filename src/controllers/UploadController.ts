import UploadService from "@/services/UploadService";
import logger from "@/utils/logger";
import { Request, Response } from "express";

const UploadController = {
  //GET FILE
  getFile: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const download = req.query.download;

      const result = await UploadService.get(req, id);

      if (!result.success) {
        res.status(result.status).json(result.data);
        return;
      }

      const file = result.data.file as Buffer<ArrayBufferLike>;
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
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },

  //DELETE FILE
  deleteFile: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;

      const result = await UploadService.delete(req, id);

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

export default UploadController;
