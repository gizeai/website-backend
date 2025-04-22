import WebhookController from "@/controllers/WebhookController";
import { Router } from "express";

const apiRouter = Router();

apiRouter.post("/mercadopago", WebhookController.mercadopago);
apiRouter.post("/stripe", WebhookController.stripe);

export default {
  path: "/webhook",
  router: apiRouter,
};
