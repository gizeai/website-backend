import EnterpriseService from "@/services/EnterpriseService";
import InvoiceService from "@/services/InvoiceService";
import getPlanByKey from "@/utils/getPlanByKey";
import logger from "@/utils/logger";
import prisma from "@/utils/prisma";
import { Enterprise, Invoice } from "@prisma/client";
import { Request } from "express";

interface Options {
  externalReference: string;
  actualStatus: string;
  successStatus: string;
  amount?: number;
  useremail?: string;
  paymentMethod: string;
  failedStatus: string[];
}

export default async function PlanManager(req: Request, options: Options) {
  const invoices = await InvoiceService.getByExternalReference(req.t, options.externalReference);

  if (!invoices.success) {
    throw new Error(
      JSON.stringify({
        message: "Error getting invoice by external reference",
        externalReference: options.externalReference,
        status: invoices.status,
        error: invoices.data,
      })
    );
  }

  const allInvoices = invoices.data as Invoice[];
  const notProcessedErros: string[] = [];

  for await (const invoice of allInvoices) {
    if (options.actualStatus === options.successStatus) {
      const enterprise = await EnterpriseService.get(req.t, invoice.enterpriseId);

      if (enterprise.success) {
        await prisma.$transaction(async () => {
          const result = await InvoiceService.pay(
            req.t,
            invoice.id,
            options.amount ?? invoice.value,
            options.useremail ?? `ENTERPRISE_${invoice.enterpriseId}`,
            options.paymentMethod
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
      } else {
        notProcessedErros.push((enterprise.data as { error: string }).error);
      }
    } else if (options.failedStatus.includes(options.actualStatus)) {
      await InvoiceService.canceled(req.t, invoice.id);
    }
  }

  if (notProcessedErros.length > 0) {
    logger.error(notProcessedErros);
    return;
  }
}
