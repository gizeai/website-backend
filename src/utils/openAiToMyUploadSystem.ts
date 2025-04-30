import UploadService from "@/services/UploadService";
import axios from "axios";
import mime from "mime-types";
import logger from "./logger";
import mounthUploadURL from "./mounthUploadURL";

export default async function openAiToMyUploadSystem(url: string) {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });

    const fileBuffer = Buffer.from(response.data);
    const contentType = response.headers["content-type"] || "application/octet-stream";
    const extension = mime.extension(contentType) || "bin";
    const fileName = `file-${Date.now()}.${extension}`;

    const upload = await UploadService.uploadFromBuffer(
      undefined,
      fileBuffer,
      fileName,
      contentType,
      "external-uploads"
    );

    if (!upload) {
      return null;
    }

    return mounthUploadURL(upload, "external-uploads");
  } catch (error) {
    logger.error("Erro ao baixar ou enviar o arquivo:", error);
    return null;
  }
}
