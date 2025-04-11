import UserService from "@/services/UserService";
import getBearerToken from "@/utils/getBearerToken";
import { NextFunction, Request, Response } from "express";

export default function authentication() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const auth_token = getBearerToken(req);

    if (!auth_token) {
      res.status(401).json({ error: req.t("user.not_logged") });
      return;
    }

    const result = await UserService.authenticate(req, auth_token);

    if (!result.success) {
      res.status(result.status).json(result.data);
      return;
    }

    req.user = result.data;
    next();
  };
}
