import InvoiceService from "@/services/InvoiceService";
import logger from "@/utils/logger";
import { Invoice } from "@prisma/client";
import { Request, Response } from "express";
import MercadoPagoManager, { MercadoPagoPaymentStatus } from "@/managers/MercadoPagoManager";
import StripeManager from "@/managers/StripeManager";
import PlanManager from "@/managers/PlanManager";
import errorToString from "@/utils/errorToString";

const WebhookController = {
  //MERCADO PAGO WEBHOOK
  mercadopago: async (req: Request, res: Response) => {
    try {
      const mercadopago = new MercadoPagoManager(req);

      if (!mercadopago.validateSignature()) {
        throw new Error(req.t("general_erros.invalid_signature"));
      }

      const notification = mercadopago.getBody();

      if (!notification?.type || !notification?.data?.id) {
        logger.error(
          JSON.stringify({
            error: "Invalid notification payload",
            notification,
          })
        );
        return;
      }

      if (notification.type === "payment") {
        res.status(200).send("OK");

        const payment = await mercadopago.getPayment(notification.data.id);
        const externalReference = payment.external_reference;

        if (externalReference) {
          await PlanManager(req, {
            externalReference: externalReference,
            actualStatus: payment.status as MercadoPagoPaymentStatus,
            successStatus: "approved",
            amount: payment.transaction_amount,
            useremail: payment.payer?.email,
            paymentMethod: payment.payment_method_id ?? "Not found",
            failedStatus: ["cancelled", "rejected", "charged_back"],
          });
        }
      }
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: errorToString(error) });
    }
  },

  // STRIPE WEBHOOK
  stripe: async (req: Request, res: Response) => {
    try {
      const stripe = new StripeManager(req);
      const event = stripe.getEvent();

      try {
        switch (event.type) {
          case "checkout.session.completed":
            {
              const session = stripe.getSession();
              const externalReference = session?.metadata?.external_reference as string;

              if (
                !externalReference ||
                typeof externalReference !== "string" ||
                !externalReference.trim()
              ) {
                logger.error("Invalid or missing external reference", { sessionId: session.id });
                return;
              }

              res.status(200).send("OK");

              await PlanManager(req, {
                externalReference: externalReference,
                actualStatus: session.payment_status,
                successStatus: "paid",
                amount: session.amount_total ? session.amount_total / 100 : undefined,
                useremail: session.customer_details?.email ?? undefined,
                paymentMethod: session.payment_method_types?.[0] ?? "Not found",
                failedStatus: [],
              });
            }
            break;

          case "checkout.session.expired":
            {
              const session = stripe.getSession();
              const externalReference = session.metadata?.external_reference;

              if (!externalReference) {
                throw new Error(`External reference of invoice '${session.id}' not found`);
              }

              res.status(200).send("OK");

              const invoices = await InvoiceService.getByExternalReference(
                req.t,
                externalReference
              );

              if (!invoices.success) {
                throw new Error(
                  JSON.stringify({
                    externalReference,
                    status: invoices.status,
                    error: invoices.data,
                  })
                );
              }

              const allInvoices = invoices.data as Invoice[];

              for await (const invoice of allInvoices) {
                await InvoiceService.canceled(req.t, invoice.enterpriseId);
              }
            }
            break;
        }
      } catch (error) {
        logger.error(error);
      }
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: errorToString(error) });
    }
  },
};

export default WebhookController;
