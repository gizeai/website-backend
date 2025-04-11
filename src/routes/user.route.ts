import PasswordManager from "@/managers/PasswordManager";
import zodschema from "@/middlewares/zodschema";
import prisma from "@/utils/prisma";
import zodpressets from "@/utils/zodpressets";
import { Router } from "express";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import createMailer from "@/emails/email";
import i18next from "@/services/i18n";

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

    await mailer.send("account", req.body.email, "Verifique seu e-mail", template, true);

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

    res.status(200).json({ created: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default {
  path: "/user",
  router: userRoute,
};
