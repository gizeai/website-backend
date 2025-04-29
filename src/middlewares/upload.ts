import { NextFunction, Request, Response } from "express";
import multer from "multer";

function upload(formname: string, uploadLimitInMb = 3, maxFiles = 5) {
  const storage = multer.memoryStorage();
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

      next();
    });
  };
}

export default upload;
