import prisma from "@/utils/prisma";
import { User } from "@prisma/client";
import { Router } from "express";
import passport from "@/auth/passport";

const authRouter = Router();

authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
authRouter.get(
  "/microsoft",
  passport.authenticate("azuread-openidconnect", { failureRedirect: "/", session: false })
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  async (req, res) => {
    const user = req.user as User;
    const token = user?.authToken;

    if (token) {
      await prisma.user.update({
        where: { id: user.id },
        data: { authToken: token },
      });

      res.json({ message: "Logado com sucesso", token });
      return;
    }

    res.status(404).json({ error: "auth_token not found" });
  }
);

authRouter.get(
  "/auth/microsoft/callback",
  passport.authenticate("azuread-openidconnect", { failureRedirect: "/", session: false }),
  async (req, res) => {
    const user = req.user as User;
    const token = user?.authToken;

    if (token) {
      await prisma.user.update({
        where: { id: user.id },
        data: { authToken: token },
      });

      res.json({ message: "Logado com sucesso", token });
      return;
    }

    res.status(404).json({ error: "auth_token not found" });
  }
);

export default {
  path: "/auth",
  router: authRouter,
};
