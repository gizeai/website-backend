import { Upload, User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      uploads?: Upload[];
      user?: User;
    }
  }
}
