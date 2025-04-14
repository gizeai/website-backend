import { Upload } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      upload?: Upload;
    }
  }
}
