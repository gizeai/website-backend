import prisma from "@/utils/prisma";
import { User } from "@prisma/client";
import * as fs from "fs";
import { TFunction } from "i18next";

type Translaction = TFunction<"translation", undefined>;

const UploadService = {
  upload: async (user: User | undefined, file: Express.Multer.File) => {
    let userid = "";

    if (user) {
      userid = user.id;
    }

    const upload = await prisma.upload.create({
      data: {
        fileName: file.filename,
        userId: userid,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storedLocation: file.path,
      },
    });

    return upload;
  },

  get: async (t: Translaction, id: string) => {
    const upload = await prisma.upload.findUnique({
      where: {
        id: id,
      },
    });

    if (!upload) {
      return {
        success: false,
        status: 404,
        data: { error: t("upload.file_not_found") },
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

  delete: async (t: Translaction, user: User | undefined, id: string) => {
    const upload = await prisma.upload.findUnique({
      where: {
        id: id,
      },
    });

    if (!upload) {
      return {
        success: false,
        status: 404,
        data: { error: t("upload.file_not_found") },
      };
    }

    if (upload.userId !== (user as User | undefined)?.id) {
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.not_permission_to_action") },
      };
    }

    if (fs.existsSync(upload.storedLocation)) {
      fs.unlinkSync(upload.storedLocation);
    }

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

  deleteForce: async (t: Translaction, id: string) => {
    const upload = await prisma.upload.findUnique({
      where: {
        id: id,
      },
    });

    if (!upload) {
      return {
        success: false,
        status: 404,
        data: { error: t("upload.file_not_found") },
      };
    }

    try {
      await prisma.upload.delete({
        where: {
          id: upload.id,
        },
      });
    } catch {
      /* empty */
    }

    if (fs.existsSync(upload.storedLocation)) {
      fs.unlinkSync(upload.storedLocation);
    }

    return {
      success: true,
      status: 200,
      data: { deleted: true },
    };
  },
};

export default UploadService;
