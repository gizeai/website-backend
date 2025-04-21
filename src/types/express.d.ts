import { Upload, User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      upload?: Upload;
      user?: User;
    }
  }
}
