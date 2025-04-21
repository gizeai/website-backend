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

function upload(formname: string, uploadLimitInMb = 3) {
  const uploadMiddleware = multer({
    storage,
    limits: {
      fileSize: uploadLimitInMb * 1024 * 1024,
    },
  }).single(formname);

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
      if (!req.file) {
        next();
        return;
      }

      try {
        const upload = await UploadService.upload((req.user as User) ?? undefined, req.file);
        req.upload = upload;
        next();
      } catch (error) {
        logger.error(error);
        res.status(500).json({ error: req.t("general_erros.internal_server_error") });
      }
    });
  };
}

export default upload;
