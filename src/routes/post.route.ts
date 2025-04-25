import zodschema from "@/middlewares/zodschema";
import { Router } from "express";
import { z } from "zod";
import i18next from "@/utils/i18n";
import authentication from "@/middlewares/authentication";
import PostController from "@/controllers/PostController";
import upload from "@/middlewares/upload";

const postRoute = Router();

//POST /api/post/create
const postCreateSchema = z.object({
  title: z.string().min(5, i18next.t("post.invalid_title")),
  description: z.string().min(5, i18next.t("post.invalid_description")),
  art_model: z.enum(["art", "ghibi", "animation", "realistic"]),
  type: z.enum(["image", "video", "carrousel"]),
  files: z.any(),
  enterprise_id: z.string().uuid(),
  carrousel_count: z
    .string()
    .refine(value => Number(value) > 0)
    .transform(value => Number(value))
    .optional(),
  instructions: z.string().refine(value => {
    const instructions = JSON.parse(value);
    const instructionsSchema = z.array(
      z.object({
        description: z.string().min(20, i18next.t("post.invalid_instruction_description")),
        fileName: z.string(),
      })
    );

    return instructionsSchema.safeParse(instructions).success;
  }),
});

postRoute.post(
  "/create",
  upload("files"),
  zodschema(postCreateSchema),
  authentication(),
  PostController.create
);

export default {
  path: "/post",
  router: postRoute,
};
