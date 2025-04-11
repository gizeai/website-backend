import UserService from "@/services/UserService";
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
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },

  //VERIFY USER
  verify: async (req: Request, res: Response) => {
    try {
      const result = await UserService.verify(req, req.body.email, req.body.code);

      if (!result.success) {
        res.status(result.status).json(result.data);
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },

  //LOGIN USER
  login: async (req: Request, res: Response) => {
    try {
      const result = await UserService.login(req, req.body.email, req.body.password);

      if (!result.success) {
        res.status(result.status).json(result.data);
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: req.t("general_erros.internal_server_error") });
    }
  },
};

export default UserController;
