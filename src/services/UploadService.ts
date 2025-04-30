import errorToString from "@/utils/errorToString";
import logger from "@/utils/logger";
import prisma from "@/utils/prisma";
import supabase from "@/utils/supabase";
import { User } from "@prisma/client";
import { TFunction } from "i18next";

type Translaction = TFunction<"translation", undefined>;
export type buckets = "external-uploads";

const UploadService = {
  upload: async (user: User | undefined, file: Express.Multer.File, bucket: buckets) => {
    let userid = "";

    if (user) {
      userid = user.id;
    }

    const filename = `${Date.now()}_${file.originalname}`;
    const filePath = `uploads/${filename}`;

    const blob = new Blob([file.buffer], { type: file.mimetype });
    const { error } = await supabase.storage.from(bucket).upload(filePath, blob, {
      contentType: file.mimetype,
    });

    if (error) {
      logger.error(error);
      throw new Error(errorToString(error));
    }

    const upload = await prisma.upload.create({
      data: {
        fileName: filename,
        userId: userid,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storedLocation: filePath,
      },
    });

    return upload;
  },

  uploadFromBuffer: async (
    user: User | undefined,
    file: Buffer,
    filename: string,
    mimeType: string,
    bucket: buckets
  ) => {
    let userid = "";

    if (user) {
      userid = user.id;
    }

    const filePath = `uploads/${Date.now()}_${filename}`;
    const blob = new Blob([file], { type: mimeType });
    const { error } = await supabase.storage.from(bucket).upload(filePath, blob);

    if (error) {
      logger.error(error);
      return;
    }

    const upload = await prisma.upload.create({
      data: {
        fileName: filename,
        userId: userid,
        originalName: filename,
        mimeType: mimeType,
        size: file.length,
        storedLocation: filePath,
      },
    });

    return upload;
  },

  uploadWithInfos: async (
    user: User | undefined,
    filename: string,
    originalname: string,
    mimetype: string,
    size: number,
    path: string
  ) => {
    let userid = "";

    if (user) {
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

  get: async (t: Translaction, id: string, bucket: buckets) => {
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

    const file = await supabase.storage.from(bucket).download(upload.storedLocation);

    return {
      success: true,
      status: 200,
      data: {
        file: file.data,
        fileName: upload.fileName,
        mimeType: upload.mimeType,
        size: upload.size,
      },
    };
  },

  async download(path: string, bucket: buckets) {
    const file = await supabase.storage.from(bucket).download(path);

    return {
      success: true,
      status: 200,
      data: {
        file: file.data,
        mimeType: file.data?.type,
      },
    };
  },

  getUploadPrisma: async (t: Translaction, id: string) => {
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

    return {
      success: true,
      status: 200,
      data: upload,
    };
  },

  getUploadPrismaFromPath: async (t: Translaction, path: string) => {
    const upload = await prisma.upload.findFirst({
      where: {
        storedLocation: path,
      },
    });

    if (!upload) {
      return {
        success: false,
        status: 404,
        data: { error: t("upload.file_not_found") },
      };
    }

    return {
      success: true,
      status: 200,
      data: upload,
    };
  },

  delete: async (t: Translaction, user: User | undefined, id: string, bucket: buckets) => {
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

    const { error } = await supabase.storage.from(bucket).remove([upload.storedLocation]);

    if (error) {
      logger.error(error);
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.internal_server_error") },
      };
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

  deleteForce: async (t: Translaction, id: string, bucket: buckets) => {
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

    const { error } = await supabase.storage.from(bucket).remove([upload.storedLocation]);

    if (error) {
      logger.error(error);
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.internal_server_error") },
      };
    }

    try {
      await prisma.upload.delete({
        where: {
          id: upload.id,
        },
      });
    } catch (error) {
      logger.error(error);
    }

    return {
      success: true,
      status: 200,
      data: { deleted: true },
    };
  },

  deleteManyForce: async (t: Translaction, ids: string[], bucket: buckets) => {
    const deleteds = await prisma.upload.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    const { error } = await supabase.storage
      .from(bucket)
      .remove(deleteds.map(rm => rm.storedLocation));

    if (error) {
      logger.error(error);
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.internal_server_error") },
      };
    }

    await prisma.upload.deleteMany({
      where: {
        id: {
          in: ids,
        },
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
