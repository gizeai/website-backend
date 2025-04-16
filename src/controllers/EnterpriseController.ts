import { PlansNamesTypes } from "@/constants/PLANS";
import { recurrencesType } from "@/managers/Cart";
import EnterpriseService from "@/services/EnterpriseService";
import InvoiceService from "@/services/InvoiceService";
import { Quotes } from "@/types/quotes";
import logger from "@/utils/logger";
import { User } from "@prisma/client";
import { Request, Response } from "express";

const EnterpriseController = {
  //CREATE ENTERPRISE
  create: async (req: Request, res: Response) => {
    try {
      const name = req.body.name as string;
      const plan = req.body.plan as PlansNamesTypes;
      const recurrence = req.body.recurrence as recurrencesType;
      const currency = req.body.currency as keyof Quotes["rates"];

      const enterprise = await EnterpriseService.create(req.t, name, plan, req.user as User);

      if (!enterprise.success) {
        res.status(enterprise.status).json(enterprise.data);
        return;
      }

      const invoice = await InvoiceService.create(enterprise.data, plan, recurrence, currency);

      if (!invoice.success) {
        //TODO: Deletar a empresa criada (faça isso quando a função estiver pronta)
        res.status(invoice.status).json(invoice.data);
        return;
      }

      res.status(201).json({
        invoice: invoice.data.id,
      });
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },
};

export default EnterpriseController;
