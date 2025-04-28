import PLANS, { PlansNamesTypes } from "@/constants/PLANS";
import createMailer from "@/emails/email";
import EnterpriseLogs from "@/managers/EnterpriseLogs";
import PasswordManager from "@/managers/PasswordManager";
import isPermission from "@/utils/isPermission";
import logger from "@/utils/logger";
import prisma from "@/utils/prisma";
import { Enterprise, Plan, User } from "@prisma/client";
import { TFunction } from "i18next";

type Translaction = TFunction<"translation", undefined>;

const EnterpriseService = {
  create: async (t: Translaction, name: string, plan: PlansNamesTypes, user: User) => {
    const enterprise = await prisma.enterprise.create({
      data: {
        name: name,
        plan: PLANS[plan].database_key as Plan,
        credits: 0,
        expireAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
        infos: "",
        personality: "",
        active: false,
        lastCreditsUpdate: new Date(),
        user: { connect: { id: user.id } },
      },
    });

    return {
      success: true,
      status: 200,
      data: enterprise,
    };
  },

  edit: async <K extends keyof Enterprise>(
    t: Translaction,
    user: User | undefined,
    id: string,
    edit: Record<K, Enterprise[K] | undefined>
  ) => {
    const enterprise = await prisma.enterprise.findUnique({
      where: {
        id: id,
      },
    });

    if (!enterprise) {
      return {
        success: false,
        status: 404,
        data: { error: t("enterprise.not_found") },
      };
    }

    if (!user) {
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.not_permission_to_action") },
      };
    }

    if (!(await isPermission(enterprise, user).isAdministrator())) {
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.not_permission_to_action") },
      };
    }

    await prisma.enterprise.update({
      where: {
        id: id,
      },
      data: edit,
    });

    return {
      success: true,
      status: 200,
      data: { updated: true },
    };
  },

  editForce: async <K extends keyof Enterprise>(
    t: Translaction,
    id: string,
    edit: Record<K, Enterprise[K]>
  ) => {
    const enterprise = await prisma.enterprise.findUnique({
      where: {
        id: id,
      },
    });

    if (!enterprise) {
      return {
        success: false,
        status: 404,
        data: { error: t("enterprise.not_found") },
      };
    }

    await prisma.enterprise.update({
      where: {
        id: id,
      },
      data: edit,
    });

    return {
      success: true,
      status: 200,
      data: { updated: true },
    };
  },

  get: async (t: Translaction, id: string, options?: { full?: boolean; active?: boolean }) => {
    const enterprise = await prisma.enterprise.findUnique({
      where: {
        id: id,
        active: options?.active ? true : undefined,
      },
      include: options?.full ? { logs: true, posts: true, subusers: true } : undefined,
    });

    if (!enterprise) {
      return {
        success: false,
        status: 404,
        data: { error: t("enterprise.not_found") },
      };
    }

    return {
      success: true,
      status: 200,
      data: enterprise,
    };
  },

  getAllByUser: async (user: User, options?: { minimal?: boolean; active?: boolean }) => {
    const minimalWhere = {
      id: true,
      name: true,
      credits: true,
      active: true,
      plan: true,
      _count: {
        select: {
          posts: true,
        },
      },
    };

    const enterprises = await prisma.enterprise.findMany({
      where: {
        user: { id: user.id },
        active: options?.active ? true : undefined,
      },
      select: options?.minimal ? minimalWhere : undefined,
    });

    const subusers = await prisma.subuser.findMany({
      where: {
        userId: user.id,
      },
      include: {
        enterprise: options?.minimal
          ? {
              select: minimalWhere,
            }
          : true,
      },
    });

    enterprises.push(...subusers.map(subuser => subuser.enterprise));

    return {
      success: true,
      status: 200,
      data: options?.active ? enterprises.filter(enterprise => enterprise.active) : enterprises,
    };
  },

  deleteForced: async (t: Translaction, id: string) => {
    const enterprise = await prisma.enterprise.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!enterprise) {
      return {
        success: false,
        status: 404,
        data: { error: t("enterprise.not_found") },
      };
    }

    await prisma.enterprise.delete({
      where: {
        id: id,
      },
    });

    return {
      success: true,
      status: 200,
      data: { deleted: true },
    };
  },

  delete: async (t: Translaction, user: User | undefined, id: string, accountPassword: string) => {
    const enterprise = await prisma.enterprise.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!enterprise) {
      return {
        success: false,
        status: 404,
        data: { error: t("enterprise.not_found") },
      };
    }

    if (enterprise.userId !== (user as User)?.id) {
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.not_permission_to_action") },
      };
    }

    if (!PasswordManager.comparePassword(accountPassword, (user as User)?.password ?? "")) {
      return {
        success: false,
        status: 400,
        data: { error: t("user.invalid_password") },
      };
    }

    await prisma.enterprise.delete({
      where: {
        id: id,
      },
    });

    return {
      success: true,
      status: 200,
      data: { deleted: true },
    };
  },

  listubuser: async (t: Translaction, user: User | undefined, id: string) => {
    const enterprise = await prisma.enterprise.findUnique({
      where: {
        id: id,
        active: true,
      },
      include: { logs: true },
    });

    if (!enterprise) {
      return {
        success: false,
        status: 404,
        data: { error: t("enterprise.not_found") },
      };
    }

    if (!user) {
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.not_permission_to_action") },
      };
    }

    if (!(await isPermission(enterprise, user).isAdministrator())) {
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.not_permission_to_action") },
      };
    }

    const allSubusers = await prisma.subuser.findMany({
      where: {
        enterpriseId: enterprise.id,
      },
      select: {
        email: true,
        id: true,
        permission: true,
        userId: true,
        userName: true,
      },
    });

    return {
      success: true,
      status: 201,
      data: allSubusers,
    };
  },

  addSubuser: async (
    t: Translaction,
    user: User | undefined,
    id: string,
    email: string,
    userPerm: "USER" | "ADMINISTRATOR"
  ) => {
    const enterprise = await prisma.enterprise.findUnique({
      where: {
        id: id,
        active: true,
      },
      include: { logs: true },
    });

    if (!enterprise) {
      return {
        success: false,
        status: 404,
        data: { error: t("enterprise.not_found") },
      };
    }

    if (!user) {
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.not_permission_to_action") },
      };
    }

    if (!(await isPermission(enterprise, user).isAdministrator())) {
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.not_permission_to_action") },
      };
    }

    const subuserAccount = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!subuserAccount) {
      return {
        success: false,
        status: 404,
        data: { error: t("user.user_not_found_with_email") },
      };
    }

    if (subuserAccount.id === user.id) {
      return {
        success: false,
        status: 400,
        data: { error: t("enterprise.cant_add_yourself_subuser") },
      };
    }

    const isSubuser = await prisma.subuser.findFirst({
      where: {
        userId: subuserAccount.id,
        enterpriseId: id,
      },
      select: {
        email: true,
      },
    });

    if (isSubuser) {
      return {
        success: false,
        status: 409,
        data: { error: t("enterprise.subuser_is_exists") },
      };
    }

    const enterpriseLogs = new EnterpriseLogs(enterprise);
    enterpriseLogs.addLogs({
      title: "Usuário adicionado",
      tag: "NEW_SUBUSER",
      userId: user.id,
      userName: user.name,
    });
    await enterpriseLogs.save();

    await prisma.subuser.create({
      data: {
        email: email,
        userName: subuserAccount.name,
        permission: userPerm === "USER" ? "USER" : "ADMINISTRATOR",
        userId: subuserAccount.id,
        enterprise: {
          connect: { id: id },
        },
      },
    });

    try {
      const mailer = createMailer();

      const template = await mailer.template("subuser-created.hbs", {
        name: subuserAccount.name,
        enterpriseName: enterprise.name,
      });

      await mailer.send("account", email, "Now you are a subuser", template, true);
    } catch (error) {
      logger.error(error);
    }

    return {
      success: true,
      status: 201,
      data: { created: true },
    };
  },

  deleteSubuser: async (t: Translaction, user: User | undefined, id: string, email: string) => {
    const enterprise = await prisma.enterprise.findUnique({
      where: {
        id: id,
        active: true,
      },
      include: { logs: true },
    });

    if (!enterprise) {
      return {
        success: false,
        status: 404,
        data: { error: t("enterprise.not_found") },
      };
    }

    if (!user) {
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.not_permission_to_action") },
      };
    }

    if (!(await isPermission(enterprise, user).isAdministrator())) {
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.not_permission_to_action") },
      };
    }

    const subuserAccount = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!subuserAccount) {
      return {
        success: false,
        status: 404,
        data: { error: t("user.user_not_found_with_email") },
      };
    }

    const isSubuser = await prisma.subuser.findFirst({
      where: {
        userId: subuserAccount.id,
        enterpriseId: id,
      },
      select: {
        id: true,
      },
    });

    if (!isSubuser) {
      return {
        success: false,
        status: 404,
        data: { error: t("enterprise.subuser_not_exists") },
      };
    }

    const enterpriseLogs = new EnterpriseLogs(enterprise);
    enterpriseLogs.addLogs({
      title: "Usuário removido",
      tag: "REMOVE_SUBUSER",
      userId: user.id,
      userName: user.name,
    });
    await enterpriseLogs.save();

    await prisma.subuser.delete({
      where: {
        id: isSubuser.id,
      },
    });

    return {
      success: true,
      status: 200,
      data: { deleted: true },
    };
  },

  editSubuser: async (
    t: Translaction,
    user: User | undefined,
    id: string,
    email: string,
    permission: "USER" | "ADMINISTRATOR"
  ) => {
    const enterprise = await prisma.enterprise.findUnique({
      where: {
        id: id,
        active: true,
      },
      include: { logs: true },
    });

    if (!enterprise) {
      return {
        success: false,
        status: 404,
        data: { error: t("enterprise.not_found") },
      };
    }

    if (!user) {
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.not_permission_to_action") },
      };
    }

    if (!(await isPermission(enterprise, user).isAdministrator())) {
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.not_permission_to_action") },
      };
    }

    const subuserAccount = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!subuserAccount) {
      return {
        success: false,
        status: 404,
        data: { error: t("user.user_not_found_with_email") },
      };
    }

    const isSubuser = await prisma.subuser.findFirst({
      where: {
        userId: subuserAccount.id,
        enterpriseId: id,
      },
      select: {
        id: true,
      },
    });

    if (!isSubuser) {
      return {
        success: false,
        status: 404,
        data: { error: t("enterprise.subuser_not_exists") },
      };
    }

    const enterpriseLogs = new EnterpriseLogs(enterprise);
    enterpriseLogs.addLogs({
      title: "Usuário editado",
      tag: "EDIT_SUBUSER",
      userId: user.id,
      userName: user.name,
    });
    await enterpriseLogs.save();

    await prisma.subuser.update({
      where: {
        id: isSubuser.id,
      },
      data: {
        permission: permission,
      },
    });

    return {
      success: true,
      status: 200,
      data: { updated: true },
    };
  },

  reduceCredits: async (id: string, count: number) => {
    await prisma.enterprise.update({
      where: {
        id: id,
      },
      data: {
        credits: {
          decrement: count,
        },
      },
    });

    return {
      success: true,
      status: 200,
      data: { reduce: true },
    };
  },
};

export default EnterpriseService;
