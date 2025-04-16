import zodschema from "@/middlewares/zodschema";
import zodpressets from "@/utils/zodpressets";
import { Router } from "express";
import { z } from "zod";
import i18next from "@/utils/i18n";
import authentication from "@/middlewares/authentication";
import EnterpriseController from "@/controllers/EnterpriseController";

const enterpriseRoute = Router();

//POST /api/user/create
const userCreateSchema = z.object({
  name: z.string().min(3, i18next.t("validators.name_min_3_caracteres")),
  plan: zodpressets.plan,
  recurrence: z.enum(["month", "year"]),
  currency: zodpressets.currency.default("BRL"),
});

enterpriseRoute.post(
  "/create",
  zodschema(userCreateSchema),
  authentication(),
  EnterpriseController.create
);

export default {
  path: "/enterprise",
  router: enterpriseRoute,
};
