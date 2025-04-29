import EnterpriseService from "@/services/EnterpriseService";
import InvoiceService from "@/services/InvoiceService";
import UserService from "@/services/UserService";
import errorToString from "@/utils/errorToString";
import logger from "@/utils/logger";
import { User } from "@prisma/client";
import { Request, Response } from "express";

const UserController = {
  //CREATE USER
  create: async (req: Request, res: Response) => {
    try {
      const result = await UserService.create(
        req.t,
        req.body.name,
        req.body.email,
        req.body.password
      );

      if (!result.success) {
        res.status(result.status).json(result.data);
        return;
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: errorToString(error) });
    }
  },

  //VERIFY USER
  verify: async (req: Request, res: Response) => {
    try {
      const result = await UserService.verify(req.t, req.body.email, req.body.code);

      if (!result.success) {
        res.status(result.status).json(result.data);
        return;
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: errorToString(error) });
    }
  },

  //LOGIN USER
  login: async (req: Request, res: Response) => {
    try {
      const result = await UserService.login(req, req.t, req.body.email, req.body.password);

      if (!result.success) {
        res.status(result.status).json(result.data);
        return;
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: errorToString(error) });
    }
  },

  //AUTHENTICATE USER
  authenticate: async (req: Request, res: Response) => {
    const user = req.user as User;

    const enterprises = await EnterpriseService.getAllByUser(user, {
      active: true,
      minimal: true,
    });

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      verification: user.verificationCode === "checked",
      createdAt: user.createdAt,
      updateAt: user.updateAt,
      lastLogin: user.lastLogin,
      enterprises: enterprises.data,
    });
    return;
  },

  // REEDEM USER
  reedem: async (req: Request, res: Response) => {
    try {
      const result = await UserService.reedem(req.t, req.body.email);

      if (!result.success) {
        res.status(result.status).json(result.data);
        return;
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: errorToString(error) });
    }
  },

  // REEDEM CODE
  reedemCode: async (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      const result = await UserService.reedemCode(req.t, req.body.email, code, req.body.password);

      if (!result.success) {
        res.status(result.status).json(result.data);
        return;
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: errorToString(error) });
    }
  },

  //INVOICES USER
  invoices: async (req: Request, res: Response) => {
    try {
      const result = await InvoiceService.getAllByUser(req.user as User);

      if (!result.success) {
        res.status(result.status).json(result.data);
        return;
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: errorToString(error) });
    }
  },

  //EDIT USER
  edit: async (req: Request, res: Response) => {
    try {
      const userId = req.user as User;
      const upload = req.uploads?.[0];
      const userName = req.body.name as string | undefined;
      const password = req.body.password as string | undefined;

      const result = await UserService.edit(req.t, userId, userName, password, upload);

      if (!result.success) {
        res.status(result.status).json(result.data);
        return;
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: errorToString(error) });
    }
  },
};

export default UserController;
