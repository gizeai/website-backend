import { PlansNamesTypes } from "@/constants/PLANS";
import { recurrencesType } from "@/managers/Cart";
import EnterpriseService from "@/services/EnterpriseService";
import InvoiceService from "@/services/InvoiceService";
import { Languages } from "@/types/langs";
import { Quotes } from "@/types/quotes";
import logger from "@/utils/logger";
import { Enterprise, User } from "@prisma/client";
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

      const shortcutDeleteEnteprise = async () => {
        await EnterpriseService.deleteForced(req.t, enterprise.data.id);
      };

      try {
        const invoice = await InvoiceService.create(
          enterprise.data,
          plan,
          recurrence,
          currency,
          "ENTERPRISE_CREATE"
        );

        if (!invoice.success) {
          await shortcutDeleteEnteprise();
          res.status(invoice.status).json(invoice.data);
          return;
        }

        res.status(201).json({
          invoice: invoice.data.id,
        });
      } catch (error) {
        await shortcutDeleteEnteprise();
        throw error;
      }
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },

  //GET ENTERPRISES
  getAll: async (req: Request, res: Response) => {
    try {
      const query = req.query;
      const enterprises = await EnterpriseService.getAllByUser(req.user as User, {
        active: query.unactiveEnterprise === "true" ? undefined : true,
        minimal: true,
      });

      if (!enterprises.success) {
        res.status(enterprises.status).json(enterprises.data);
        return;
      }

      res.status(200).json(enterprises.data);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },

  get: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const enterprise = await EnterpriseService.get(req.t, id, {
        full: true,
      });

      if (!enterprise.success) {
        res.status(enterprise.status).json(enterprise.data);
        return;
      }

      const enterpriseData = enterprise.data as Enterprise;

      if (!enterpriseData.active) {
        res.status(404).json({ error: req.t("enterprise.not_active") });
        return;
      }

      if (enterpriseData.expireAt < new Date()) {
        res.status(404).json({ error: req.t("enterprise.expired") });
        return;
      }

      res.status(200).json(enterpriseData);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },

  edit: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const enterprise = await EnterpriseService.get(req.t, id, {
        full: true,
      });

      if (!enterprise.success) {
        res.status(enterprise.status).json(enterprise.data);
        return;
      }

      const name = req.body.name as string | undefined;
      const personality = req.body.personality as string | undefined;
      const colors = req.body.colors as string | undefined;
      const font = req.body.font as string | undefined;
      const keywords = req.body.keywords as string[] | undefined;
      const lang = req.body.lang as Languages | undefined;
      const infos = req.body.infos as string | undefined;

      const result = await EnterpriseService.edit(req.t, req.user as User, id, {
        name,
        personality,
        colors,
        font,
        keywords,
        language: lang as string,
        infos,
      });

      if (!result.success) {
        res.status(result.status).json(result.data);
        return;
      }

      res.status(200).json({ update: true });
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const password = req.body.password as string;
      const result = await EnterpriseService.delete(req.t, req.user as User, id, password);

      if (!result.success) {
        res.status(result.status).json(result.data);
        return;
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },

  listSubuser: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const result = await EnterpriseService.listubuser(req.t, req.user as User, id);

      if (!result.success) {
        res.status(result.status).json(result.data);
        return;
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },

  addSubuser: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const email = req.body.email as string;
      const permission = req.body.ppermission as "USER" | "ADMINISTRATOR";
      const result = await EnterpriseService.addSubuser(
        req.t,
        req.user as User,
        id,
        email,
        permission
      );

      if (!result.success) {
        res.status(result.status).json(result.data);
        return;
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },

  removeSubuser: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const email = req.body.email as string;
      const result = await EnterpriseService.deleteSubuser(req.t, req.user as User, id, email);

      if (!result.success) {
        res.status(result.status).json(result.data);
        return;
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },

  editSubuser: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const email = req.body.email as string;
      const permission = req.body.ppermission as "USER" | "ADMINISTRATOR";
      const result = await EnterpriseService.editSubuser(
        req.t,
        req.user as User,
        id,
        email,
        permission
      );

      if (!result.success) {
        res.status(result.status).json(result.data);
        return;
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },
};

export default EnterpriseController;
