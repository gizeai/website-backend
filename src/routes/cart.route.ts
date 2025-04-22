import zodschema from "@/middlewares/zodschema";
import zodpressets from "@/utils/zodpressets";
import { Router } from "express";
import { z } from "zod";
import authentication from "@/middlewares/authentication";
import CartController from "@/controllers/CartController";

const cartRoute = Router();

//POST /api/cart/pay
const payScheme = z.object({
  paymentMethod: zodpressets.paymentMethod,
  invoices: z.array(z.string().uuid()).min(1),
  currency: zodpressets.currency,
});

cartRoute.post("/pay", zodschema(payScheme), authentication(), CartController.pay);

export default {
  path: "/cart",
  router: cartRoute,
};
