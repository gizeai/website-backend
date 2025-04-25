import zodschema from "@/middlewares/zodschema";
import zodpressets from "@/utils/zodpressets";
import { Router } from "express";
import { z } from "zod";
import i18next from "@/utils/i18n";
import UserController from "@/controllers/UserController";
import authentication from "@/middlewares/authentication";
import upload from "@/middlewares/upload";

const userRoute = Router();

//POST /api/user/create
const userCreateSchema = z.object({
  name: z.string().min(3, i18next.t("validators.name_min_3_caracteres")),
  email: zodpressets.email,
  password: zodpressets.password,
});

userRoute.post("/create", zodschema(userCreateSchema), UserController.create);

//PUT /api/user/verify
const userVerifySchema = z.object({
  email: zodpressets.email,
  code: z.string().min(6, i18next.t("validators.code_min_6_caracteres")),
});

userRoute.put("/verify", zodschema(userVerifySchema), UserController.verify);

//POST /api/user/login
const userloginSchema = z.object({
  email: zodpressets.email,
  password: zodpressets.password,
});

userRoute.post("/login", zodschema(userloginSchema), UserController.login);

//GET /api/user/auth
userRoute.get("/auth", authentication(), UserController.authenticate);

//POST /api/user/reedem
const userReedemSchema = z.object({
  email: zodpressets.email,
});

userRoute.post("/reedem", zodschema(userReedemSchema), UserController.reedem);

//PUT /api/user/reedem/:code
const userReedemCodeSchema = z.object({
  email: zodpressets.email,
  password: zodpressets.password,
});

userRoute.put("/reedem/:code", zodschema(userReedemCodeSchema), UserController.reedemCode);

//PUT /api/user/invoices
userRoute.get("/invoices", authentication(), UserController.invoices);

//PUT /api/user/edit
const userEditCodeSchema = z.object({
  name: z.string().min(3, i18next.t("validators.name_min_3_caracteres")),
  avatar: z.any(),
  password: zodpressets.password,
});
userRoute.put(
  "/edit",
  zodschema(userEditCodeSchema),
  authentication(),
  upload("avatar"),
  UserController.edit
);

export default {
  path: "/user",
  router: userRoute,
};
