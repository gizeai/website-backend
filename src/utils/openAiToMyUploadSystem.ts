import UploadService from "@/services/UploadService";
import axios from "axios";
import path from "path";
import * as fs from "fs";
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
    const urlParts = url.split("?")[0].split("/");
    const baseName = urlParts[urlParts.length - 1].split(".")[0] || `file-${Date.now()}`;
    const fileName = `file-${Date.now()}.${extension}`;
    const filePath = path.join(path.resolve(__dirname, "..", "..", "uploads"), fileName);

    fs.writeFileSync(filePath, fileBuffer);

    const stats = fs.statSync(filePath);
    const fileInfo = {
      filename: fileName,
      originalName: baseName,
      mimetype: contentType,
      size: stats.size,
      local: filePath,
    };

    const upload = await UploadService.uploadWithInfos(
      undefined,
      fileInfo.filename,
      fileInfo.originalName,
      fileInfo.mimetype,
      fileInfo.size,
      path.resolve(fileInfo.local)
    );

    return mounthUploadURL(upload);
  } catch (error) {
    logger.error("Erro ao baixar ou enviar o arquivo:", error);
    return null;
  }
}
