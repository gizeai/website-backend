import UploadController from "@/controllers/UploadController";
import authentication from "@/middlewares/authentication";
import { Router } from "express";

const uploadRouter = Router();

// GET /api/uploads/:id
uploadRouter.get("/:id", UploadController.getFile);

// DELETE /api/uploads/:id
uploadRouter.delete("/:id", authentication(), UploadController.deleteFile);

export default {
  path: "/uploads",
  router: uploadRouter,
};
