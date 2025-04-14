import prisma from "@/utils/prisma";
import { User } from "@prisma/client";
import { Request, Express } from "express";
import * as fs from "fs";

const UploadService = {
  upload: async (req: Request, file: Express.Multer.File) => {
    const filename = file.filename;
    const path = file.path;
    const mimetype = file.mimetype;
    const size = file.size;
    const originalname = file.originalname;
    let userid = "";

    if (req.user) {
      const user = req.user as User;
      userid = user.id;
    }

    const upload = await prisma.upload.create({
      data: {
        fileName: filename,
        userId: userid,
        originalName: originalname,
        mimeType: mimetype,
        size: size,
        storedLocation: path,
      },
    });

    return upload;
  },

  get: async (req: Request, id: string) => {
    const upload = await prisma.upload.findUnique({
      where: {
        id: id,
      },
    });

    if (!upload) {
      return {
        success: false,
        status: 404,
        data: { error: req.t("upload.file_not_found") },
      };
    }

    const file = fs.readFileSync(upload.storedLocation);

    return {
      success: true,
      status: 200,
      data: {
        file: file,
        fileName: upload.fileName,
        mimeType: upload.mimeType,
        size: upload.size,
      },
    };
  },

  delete: async (req: Request, id: string) => {
    const upload = await prisma.upload.findUnique({
      where: {
        id: id,
      },
    });

    if (!upload) {
      return {
        success: false,
        status: 404,
        data: { error: req.t("upload.file_not_found") },
      };
    }

    if (upload.userId !== (req.user as User | undefined)?.id) {
      return {
        success: false,
        status: 403,
        data: { error: req.t("general_erros.not_permission_to_action") },
      };
    }

    fs.unlinkSync(upload.storedLocation);

    await prisma.upload.delete({
      where: {
        id: id,
      },
    });

    return {
      success: true,
      status: 200,
      data: { deleted: true },
    };
  },
};

export default UploadService;
