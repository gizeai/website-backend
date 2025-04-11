import PasswordManager from "@/managers/PasswordManager";
import zodschema from "@/middlewares/zodschema";
import prisma from "@/utils/prisma";
import zodpressets from "@/utils/zodpressets";
import { Router } from "express";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import createMailer from "@/emails/email";
import i18next from "@/services/i18n";
import requestIp from "request-ip";
import JsonWebToken from "@/managers/JsonWebToken";

const userRoute = Router();

//POST /api/user/create
const userCreateSchema = z.object({
  name: z.string().min(3, i18next.t("validators.name_min_3_caracteres")),
  email: zodpressets.email,
  password: zodpressets.password,
});

userRoute.post("/create", zodschema(userCreateSchema), async (req, res) => {
  try {
    const hashPassword = PasswordManager.hashPassword(req.body.password);
    const randomCode = Math.random().toString(36).slice(2, 8).toUpperCase();

    const userExists = await prisma.user.findFirst({
      where: { email: req.body.email },
    });

    if (userExists) {
      if (userExists.verificationCode === "checked") {
        res.status(409).json({ error: req.t("user.email_exists") });
        return;
      }

      await prisma.user.delete({ where: { id: userExists.id } });
    }

    const mailer = createMailer();

    const template = await mailer.template("verification.hbs", {
      name: req.body.name,
      code: randomCode,
    });

    await mailer.send("account", req.body.email, "Verify your account", template, true);

    await prisma.user.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        signUpId: uuid(),
        password: hashPassword,
        verificationCode: randomCode,
        loginMethod: "CREDENTIALS",
      },
    });

    res.status(201).json({ created: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: req.t("general_erros.internal_server_error") });
  }
});

//PUT /api/user/verify
const userVerifySchema = z.object({
  email: zodpressets.email,
  code: z.string().min(6, i18next.t("validators.code_min_6_caracteres")),
});

userRoute.put("/verify", zodschema(userVerifySchema), async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { email: req.body.email },
    });

    if (!user) {
      res.status(404).json({ error: req.t("user.user_not_found") });
      return;
    }

    if (user.verificationCode === "checked") {
      res.status(400).json({ error: req.t("user.already_verified") });
      return;
    }

    if (user.verificationCode !== req.body.code) {
      res.status(400).json({ error: req.t("user.invalid_code") });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode: "checked" },
    });

    try {
      const mailer = createMailer();
      const template = await mailer.template("account-created.hbs", { name: user.name });
      await mailer.send("account", user.email, "Account created", template, true);
    } catch (error) {
      console.error(error);
    }

    res.status(200).json({ verified: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: req.t("general_erros.internal_server_error") });
  }
});

//POST /api/user/verify
const userloginSchema = z.object({
  email: zodpressets.email,
  password: zodpressets.password,
});

userRoute.post("/login", zodschema(userloginSchema), async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { email: req.body.email },
    });

    if (!user) {
      res.status(404).json({ error: req.t("user.user_not_found") });
      return;
    }

    if (user.verificationCode !== "checked") {
      res.status(400).json({ error: req.t("user.not_verified") });
      return;
    }

    if (!PasswordManager.comparePassword(req.body.password, user.password)) {
      res.status(400).json({ error: req.t("user.invalid_password") });
      return;
    }

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

    const token = JsonWebToken.signUser({ id: user.id, email: user.email, name: user.name });

    await prisma.session.create({
      data: {
        ipAddress: String(clientIp),
        expireAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        token: token,
        user: { connect: { id: user.id } },
        signature: deviceSignature,
      },
    });

    res.status(200).json({ success: true, auth_token: token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: req.t("general_erros.internal_server_error") });
  }
});

export default {
  path: "/user",
  router: userRoute,
};
