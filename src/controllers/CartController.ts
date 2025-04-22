import { PlansNamesTypes } from "@/constants/PLANS";
import Cart, { paymentsType } from "@/managers/Cart";
import InvoiceService from "@/services/InvoiceService";
import { Currencys } from "@/types/quotes";
import logger from "@/utils/logger";
import { Invoice } from "@prisma/client";
import { Request, Response } from "express";

const CartController = {
  //PAY CART
  pay: async (req: Request, res: Response) => {
    try {
      const paymentMethod = req.body.paymentMethod as paymentsType;
      const invoicesIds = req.body.invoices as string[];
      const curency = req.body.currency as Currencys;

      const cart = new Cart(paymentMethod);

      for await (const id of invoicesIds) {
        const invoice = await InvoiceService.get(req.t, id);

        if (!invoice.success) {
          res.status(invoice.status).json(invoice.data);
          return;
        }

        const inv = invoice.data as Invoice;

        cart.addProduct({
          enterpriseId: inv.enterpriseId,
          plan: inv.plan.toLowerCase() as PlansNamesTypes,
          recurrence: inv.recurrence === "YEARLY" ? "year" : "month",
          external_reference: inv.id,
        });
      }

      const paymentUrl = await cart.link(curency);

      if (!paymentUrl.success) {
        res.status(paymentUrl.status).json({ error: paymentUrl.error });
        return;
      }

      for await (const id of invoicesIds) {
        try {
          await InvoiceService.definePaymentUrl(req.t, id, paymentUrl.link);
        } catch (error) {
          logger.error(error);
          continue;
        }
      }

      res.status(200).json({
        url: paymentUrl.link,
      });
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },
};

export default CartController;
