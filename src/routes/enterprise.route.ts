import zodschema from "@/middlewares/zodschema";
import zodpressets from "@/utils/zodpressets";
import { Router } from "express";
import { z } from "zod";
import i18next from "@/utils/i18n";
import authentication from "@/middlewares/authentication";
import EnterpriseController from "@/controllers/EnterpriseController";

const enterpriseRoute = Router();

//POST /api/user/create
const enterpriseCreateSchema = z.object({
  name: z.string().min(3, i18next.t("validators.name_min_3_caracteres")),
  plan: zodpressets.plan,
  recurrence: z.enum(["month", "year"]),
  currency: zodpressets.currency.default("BRL"),
});

enterpriseRoute.post(
  "/create",
  zodschema(enterpriseCreateSchema),
  authentication(),
  EnterpriseController.create
);

//GET /api/enterprise
enterpriseRoute.get("/", authentication(), EnterpriseController.getAll);

//GET /api/enterprise/:id
enterpriseRoute.get("/:id", authentication(), EnterpriseController.get);

//PUT /api/enterprise/:id/edit
const enterpriseEditSchema = z.object({
  name: z.string().min(3, i18next.t("validators.name_min_3_caracteres")).optional(),
  personality: z.string().optional(),
  colors: z.string().optional(),
  font: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  lang: zodpressets.langs.optional(),
  infos: z.string().optional(),
});

enterpriseRoute.put(
  "/:id/edit",
  zodschema(enterpriseEditSchema),
  authentication(),
  EnterpriseController.edit
);

export default {
  path: "/enterprise",
  router: enterpriseRoute,
};
