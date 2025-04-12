import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import logger from "@/utils/logger";

const user = process.env.EMAIL_USER as string;
const pass = process.env.EMAIL_PASS as string;

const config: {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  logger?: boolean;
  tls?: {
    rejectUnauthorized: boolean;
  };
  ignoreTLS?: boolean;
} = {
  host: process.env.EMAIL_HOST as string,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
};

if (user && pass) {
  config.auth = {
    user,
    pass,
  };
}

const froms = {
  account: '"Imaginia" <account@imaginia.com>',
  support: '"Imaginia" <support@imaginia.com>',
};

export default function createMailer(
  host?: string,
  port?: number,
  secure?: boolean,
  user?: string,
  pass?: string
) {
  if (host) config.host = host;
  if (port) config.port = port;
  if (secure) config.secure = secure;

  if (user && pass) {
    config.auth = {
      user,
      pass,
    };
  }

  const transporter = nodemailer.createTransport(config);

  type templates =
    | "verification.hbs"
    | "account-created.hbs"
    | "password-reset.hbs"
    | "password_reseted.hbs";
  async function renderTemplate(pathname: templates, data: Record<string, unknown>) {
    const filePath = path.resolve(__dirname, "templates", pathname);
    const source = fs.readFileSync(filePath, "utf-8");
    const template = handlebars.compile(source);
    return template(data);
  }

  async function send(
    from: keyof typeof froms,
    to: string,
    subject: string,
    message: string,
    html: boolean = false
  ) {
    try {
      const verify = await transporter.verify();

      if (verify) {
        await transporter.sendMail({
          from: froms[from],
          subject: subject,
          to: to,
          html: html ? message : undefined,
          text: !html ? message : undefined,
        });

        return true;
      }

      return false;
    } catch (error) {
      logger.error(error);
      return false;
    }
  }

  return {
    send,
    template: renderTemplate,
  };
}
