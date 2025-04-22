import InvoiceService from "@/services/InvoiceService";
import logger from "@/utils/logger";
import { Enterprise, Invoice } from "@prisma/client";
import { Request, Response } from "express";
import EnterpriseService from "@/services/EnterpriseService";
import getPlanByKey from "@/utils/getPlanByKey";
import MercadoPagoManager, { MercadoPagoPaymentStatus } from "@/managers/MercadoPagoManager";
import prisma from "@/utils/prisma";
import StripeManager from "@/managers/StripeManager";

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
          const invoices = await InvoiceService.getByExternalReference(req.t, externalReference);

          if (!invoices.success) {
            throw new Error((invoices.data as { error: string })?.error);
          }

          const allInvoices = invoices.data as Invoice[];

          const notProcessedErros: string[] = [];

          for await (const invoice of allInvoices) {
            const status = payment.status as MercadoPagoPaymentStatus;
            const value = payment.transaction_amount ?? invoice.value;
            const useremail = payment.payer?.email ?? `ENTERPRISE_${invoice.enterpriseId}`;
            const paymentMethod = payment.payment_method_id ?? "Not found";

            if (status === "approved") {
              const enterprise = await EnterpriseService.get(req.t, invoice.enterpriseId);

              if (!enterprise.success) {
                notProcessedErros.push((enterprise.data as { error: string }).error);
                continue;
              }

              prisma.$transaction(async () => {
                const result = await InvoiceService.pay(
                  req.t,
                  invoice.id,
                  value,
                  useremail,
                  paymentMethod
                );

                if (!result.success) {
                  throw new Error(result.data?.error || "Failed to pay invoice");
                }

                const enterpriseData = enterprise.data as Enterprise;

                let expireAt = enterpriseData.expireAt.getTime() + 1000 * 60 * 60 * 24 * 30;

                if (invoice.recurrence === "YEARLY") {
                  expireAt = enterpriseData.expireAt.getTime() + 1000 * 60 * 60 * 24 * 365;
                }

                await EnterpriseService.editForce(req.t, invoice.enterpriseId, {
                  expireAt: new Date(expireAt),
                  plan: invoice.plan,
                  credits: enterpriseData.credits + getPlanByKey(invoice.plan).credits,
                  lastCreditsUpdate: new Date(),
                  active: true,
                });
              });
            } else if (
              status === "cancelled" ||
              status === "rejected" ||
              status === "charged_back"
            ) {
              await InvoiceService.canceled(req.t, invoice.enterpriseId);
            }
          }

          if (notProcessedErros.length > 0) {
            logger.error(notProcessedErros);
            return;
          }
        }
      }
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
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

              const invoices = await InvoiceService.getByExternalReference(
                req.t,
                externalReference
              );

              if (!invoices.success) {
                throw new Error(
                  JSON.stringify({
                    message: "Error getting invoice by external reference",
                    externalReference,
                    status: invoices.status,
                    error: invoices.data,
                  })
                );
              }

              const allInvoices = invoices.data as Invoice[];
              const notProcessedErros: string[] = [];

              for await (const invoice of allInvoices) {
                if (session.payment_status !== "paid") {
                  continue;
                }

                const enterprise = await EnterpriseService.get(req.t, invoice.enterpriseId);

                if (!enterprise.success) {
                  notProcessedErros.push(
                    (enterprise.data as { error: string }).error || "Failed to fetch enterprise"
                  );
                  continue;
                }

                prisma.$transaction(async () => {
                  const value = session.amount_total ? session.amount_total / 100 : invoice.value;
                  const useremail =
                    session.customer_details?.email ?? `ENTERPRISE_${invoice.enterpriseId}`;
                  const paymentMethod = session.payment_method_types?.[0] ?? "Not found";

                  const result = await InvoiceService.pay(
                    req.t,
                    invoice.id,
                    value,
                    useremail,
                    paymentMethod
                  );

                  if (!result.success) {
                    throw new Error(result.data?.error || "Failed to pay invoice");
                  }

                  const enterpriseData = enterprise.data as Enterprise;

                  let expireAt = enterpriseData.expireAt.getTime() + 1000 * 60 * 60 * 24 * 30;

                  if (invoice.recurrence === "YEARLY") {
                    expireAt = enterpriseData.expireAt.getTime() + 1000 * 60 * 60 * 24 * 365;
                  }

                  await EnterpriseService.editForce(req.t, invoice.enterpriseId, {
                    expireAt: new Date(expireAt),
                    plan: invoice.plan,
                    credits: enterpriseData.credits + getPlanByKey(invoice.plan).credits,
                    lastCreditsUpdate: new Date(),
                    active: true,
                  });
                });
              }

              if (notProcessedErros.length > 0) {
                throw new Error(notProcessedErros.join(", "));
              }
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
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },
};

export default WebhookController;
