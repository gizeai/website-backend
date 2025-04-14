import UserService from "@/services/UserService";
import logger from "@/utils/logger";
import { User } from "@prisma/client";
import { Request, Response } from "express";

const UserController = {
  //CREATE USER
  create: async (req: Request, res: Response) => {
    try {
      const result = await UserService.create(
        req,
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
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },

  //VERIFY USER
  verify: async (req: Request, res: Response) => {
    try {
      const result = await UserService.verify(req, req.body.email, req.body.code);

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

  //LOGIN USER
  login: async (req: Request, res: Response) => {
    try {
      const result = await UserService.login(req, req.body.email, req.body.password);

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

  //AUTHENTICATE USER
  authenticate: async (req: Request, res: Response) => {
    const user = req.user as User;

    const enterprises = await UserService.enterprises(user.id);

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      verificationCode: user.verificationCode === "checked",
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
      const result = await UserService.reedem(req, req.body.email);

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

  // REEDEM CODE
  reedemCode: async (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      const result = await UserService.reedemCode(req, req.body.email, code, req.body.password);

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

  //INVOICES USER
  invoices: async (req: Request, res: Response) => {
    try {
      const userId = (req.user as User).id;
      const result = await UserService.invoices(userId);

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

export default UserController;
