import UploadService from "@/services/UploadService";
import logger from "@/utils/logger";
import { User } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (Request, filename, cb) => {
    cb(null, path.resolve(__dirname, "..", "..", "uploads"));
  },

  filename: (Request, file, cb) => {
    const filename = Date.now() + "_" + path.extname(file.originalname);
    cb(null, filename);
  },
});

function upload(formname: string, uploadLimitInMb = 3, maxFiles = 5) {
  const uploadMiddleware = multer({
    storage,
    limits: {
      fileSize: uploadLimitInMb * 1024 * 1024,
    },
  }).array(formname, maxFiles);

  return (req: Request, res: Response, next: NextFunction) => {
    uploadMiddleware(req, res, async err => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ error: req.t("general_erros.file_too_large") });
          return;
        }

        res.status(500).json({ error: req.t("general_erros.upload_error") });
        return;
      }

      const files = req.files as Express.Multer.File[] | undefined;

      if (!files || files.length === 0) {
        next();
        return;
      }

      try {
        const uploads = await Promise.all(
          files.map(file => UploadService.upload((req.user as User) ?? undefined, file))
        );
        req.uploads = uploads;

        const originalJson = res.json;

        res.json = function (body) {
          if (body && body.error && (req.uploads?.length ?? 0) > 0) {
            for (const uplaod of req.uploads ?? []) {
              UploadService.deleteForce(req.t, uplaod.id);
            }
          }

          return originalJson.call(this, body);
        };

        const originalStatus = res.status;
        res.status = function (code) {
          if (code >= 400 && (req.uploads?.length ?? 0) > 0) {
            for (const uplaod of req.uploads ?? []) {
              UploadService.deleteForce(req.t, uplaod.id);
            }
          }

          return originalStatus.call(this, code);
        };

        next();
      } catch (error) {
        logger.error(error);
        res.status(500).json({ error: req.t("general_erros.internal_server_error") });
      }
    });
  };
}

export default upload;
