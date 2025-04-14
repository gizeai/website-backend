import createMailer from "@/emails/email";
import PasswordManager from "@/managers/PasswordManager";
import prisma from "@/utils/prisma";
import { Request } from "express";
import { v4 as uuid } from "uuid";
import requestIp from "request-ip";
import JsonWebToken from "@/managers/JsonWebToken";
import logger from "@/utils/logger";
import { Upload, User } from "@prisma/client";
import mounthUploadURL from "@/utils/mounthUploadURL";

const UserService = {
  create: async (req: Request, name: string, email: string, password: string) => {
    const hashPassword = PasswordManager.hashPassword(password);
    const randomCode = Math.random().toString(36).slice(2, 8).toUpperCase();

    const userExists = await prisma.user.findFirst({
      where: { email: email },
    });

    if (userExists) {
      if (userExists.verificationCode === "checked") {
        return {
          success: false,
          status: 409,
          data: { error: req.t("user.email_exists") },
        };
      }

      await prisma.user.delete({ where: { id: userExists.id } });
    }

    const mailer = createMailer();

    const template = await mailer.template("verification.hbs", {
      name: name,
      code: randomCode,
    });

    await mailer.send("account", req.body.email, "Verify your account", template, true);

    await prisma.user.create({
      data: {
        name: name,
        email: req.body.email,
        signUpId: uuid(),
        password: hashPassword,
        verificationCode: randomCode,
        loginMethod: "CREDENTIALS",
      },
    });

    return {
      success: true,
      status: 201,
      data: { created: true },
    };
  },

  verify: async (req: Request, email: string, code: string) => {
    const user = await prisma.user.findFirst({
      where: { email: email },
    });

    if (!user) {
      return {
        success: false,
        status: 404,
        data: { error: req.t("user.user_not_found") },
      };
    }

    if (user.verificationCode === "checked") {
      return {
        success: false,
        status: 400,
        data: { error: req.t("user.already_verified") },
      };
    }

    if (user.verificationCode !== code) {
      return {
        success: false,
        status: 400,
        data: { error: req.t("user.invalid_code") },
      };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode: "checked" },
    });

    try {
      const mailer = createMailer();
      const template = await mailer.template("account-created.hbs", {
        name: user.name,
      });
      await mailer.send("account", user.email, "Account created", template, true);
    } catch (error) {
      logger.error(error);
    }

    return {
      success: true,
      status: 200,
      data: { verified: true },
    };
  },

  login: async (req: Request, email: string, password: string) => {
    const user = await prisma.user.findFirst({
      where: { email: email },
    });

    if (!user) {
      return {
        success: false,
        status: 404,
        data: { error: req.t("user.user_not_found") },
      };
    }

    if (user.verificationCode !== "checked") {
      return {
        success: false,
        status: 400,
        data: { error: req.t("user.not_verified") },
      };
    }

    if (!PasswordManager.comparePassword(password, user.password)) {
      return {
        success: false,
        status: 400,
        data: { error: req.t("user.invalid_password") },
      };
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

        return {
          success: true,
          status: 200,
          data: { success: true, auth_token: session.token },
        };
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

    return {
      success: true,
      status: 200,
      data: { success: true, auth_token: token },
    };
  },

  authenticate: async (req: Request, token: string) => {
    const decode = JsonWebToken.decodeUser(token);
    if (!decode) {
      return {
        success: false,
        status: 404,
        data: { error: req.t("user.invalid_token") },
      };
    }

    const session = await prisma.session.findFirst({
      where: { token: token },
      include: { user: true },
    });

    if (!session) {
      return {
        success: false,
        status: 404,
        data: { error: req.t("user.not_user_with_token") },
      };
    }

    if (session.expireAt < new Date()) {
      return {
        success: false,
        status: 404,
        data: { error: req.t("user.invalid_token") },
      };
    }

    const user = session.user;

    return {
      success: true,
      status: 200,
      data: user,
    };
  },

  enterprises: async (userId: string) => {
    const enterprises = await prisma.enterprise.findMany({
      where: {
        user: { id: userId },
      },
      select: {
        id: true,
        name: true,
        credits: true,
        plan: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    return {
      success: true,
      status: 200,
      data: enterprises,
    };
  },

  reedem: async (req: Request, email: string) => {
    const user = await prisma.user.findFirst({
      where: { email: email },
    });

    if (!user) {
      return {
        success: false,
        status: 404,
        data: { error: req.t("user.user_not_found_with_email") },
      };
    }

    const isReedem = await prisma.reedemPassword.findFirst({
      where: { userId: user.id },
    });

    let code = Math.random().toString(36).slice(2, 8).toUpperCase();
    let isReedemVerify = false;

    if (isReedem && isReedem.expireAt < new Date()) {
      code = isReedem.code;
      isReedemVerify = true;
    }

    if (!isReedemVerify) {
      await prisma.reedemPassword.create({
        data: {
          code: code,
          userId: user.id,
          expireAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
        },
      });
    }

    const mailer = createMailer();

    const template = await mailer.template("password-reset.hbs", {
      name: user.name,
      code: code,
      email: user.email,
    });

    await mailer.send("account", user.email, "Reset your password", template, true);

    return {
      success: true,
      status: 200,
      data: { success: true },
    };
  },

  reedemCode: async (req: Request, email: string, code: string, password: string) => {
    const user = await prisma.user.findFirst({
      where: { email: email },
      select: { id: true, name: true },
    });

    if (!user) {
      return {
        success: false,
        status: 404,
        data: { error: req.t("user.user_not_found_with_email") },
      };
    }

    const reedem = await prisma.reedemPassword.findFirst({
      where: { code: code, userId: user.id },
    });

    if (!reedem) {
      return {
        success: false,
        status: 404,
        data: { error: req.t("user.code_not_found") },
      };
    }

    const hash = PasswordManager.hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hash,
      },
    });

    await prisma.reedemPassword.delete({
      where: { id: reedem.id },
    });

    try {
      const mailer = createMailer();

      const template = await mailer.template("password_reseted.hbs", {
        name: user.name,
      });

      await mailer.send("account", email, "Password reseted", template, true);
    } catch (error) {
      logger.error(error);
    }

    return {
      success: true,
      status: 200,
      data: { success: true },
    };
  },

  invoices: async (userId: string) => {
    const enterprises = await prisma.enterprise.findMany({
      where: {
        user: { id: userId },
      },
    });

    const invoices = await prisma.invoice.findMany({
      where: {
        enterpriseId: {
          in: enterprises.map(enterprise => enterprise.id),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const sortInvoices = invoices.sort((a, b) => {
      if (a.status === "PENDING" && b.status !== "PENDING") return -1;
      if (a.status === "PAID" && b.status !== "PAID") return -1;
      if (a.status !== "PENDING" && b.status === "PENDING") return 1;
      if (a.status !== "PAID" && b.status === "PAID") return 1;

      return 0;
    });

    return {
      success: true,
      status: 200,
      data: sortInvoices,
    };
  },

  edit: async (
    req: Request,
    user: User,
    name: string | undefined,
    password: string | undefined,
    upload: Upload | undefined
  ) => {
    const edit: {
      name?: string;
      password?: string;
      avatarUrl?: string;
    } = {};

    if (name) {
      edit.name = name;
    }

    if (password) {
      const hashPassword = PasswordManager.hashPassword(password);
      edit.password = hashPassword;
    }

    if (upload) {
      const url = mounthUploadURL(upload);
      edit.avatarUrl = url;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: edit,
    });

    return {
      success: true,
      status: 200,
      data: {
        update: {
          ...edit,
          password: undefined,
        },
      },
    };
  },
};

export default UserService;
