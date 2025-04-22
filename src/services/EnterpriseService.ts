import PLANS, { PlansNamesTypes } from "@/constants/PLANS";
import isPermission from "@/utils/isPermission";
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

  delete: async (t: Translaction, user: User | undefined, id: string) => {
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

    if (enterprise.userId !== (user as User | undefined)?.id) {
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.not_permission_to_action") },
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
};

export default EnterpriseService;
