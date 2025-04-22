import prisma from "@/utils/prisma";
import { User } from "@prisma/client";
import { Router } from "express";
import passport from "@/auth/passport";
import requestIp from "request-ip";
import { Request, Response } from "express";
import JsonWebToken from "@/managers/JsonWebToken";

const authRouter = Router();

authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
authRouter.get(
  "/microsoft",
  passport.authenticate("azuread-openidconnect", {
    failureRedirect: "/",
    session: false,
  })
);

const handleAuthCallback = async (req: Request, res: Response) => {
  const user = req.user as User;

  const clientIp = requestIp.getClientIp(req);
  const userAgent = req.get("User-Agent");
  const deviceSignature = `${clientIp}-${userAgent}`;

  const session = await prisma.session.findFirst({
    where: { user: { id: user.id }, signature: deviceSignature },
  });

  if (session) {
    const decode = JsonWebToken.decodeUser(session.token);
    if (decode) {
      await prisma.session.update({
        where: { id: session.id },
        data: { expireAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) },
      });

      res.status(200).json({ success: true, auth_token: session.token });
      return;
    } else {
      await prisma.session.delete({ where: { id: session.id } });
    }
  }

  const token = JsonWebToken.signUser({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  await prisma.session.create({
    data: {
      ipAddress: String(clientIp),
      expireAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      token: token,
      user: { connect: { id: user.id } },
      signature: deviceSignature,
    },
  });

  res.json({ message: "Logado com sucesso", token });
  return;
};

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  handleAuthCallback
);

authRouter.get(
  "/microsoft/callback",
  passport.authenticate("azuread-openidconnect", {
    failureRedirect: "/",
    session: false,
  }),
  handleAuthCallback
);

export default {
  path: "/auth",
  router: authRouter,
};
