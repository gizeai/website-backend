import PLANS, { PlansNamesTypes } from "@/constants/PLANS";
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

    if (enterprise.userId !== (user as User | undefined)?.id) {
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.not_permission_to_action") },
      };
    }

    const subuser = await prisma.subuser.findFirst({
      where: {
        userId: (user as User | undefined)?.id,
        enterpriseId: id,
      },
    });

    if (!subuser || subuser?.permission !== "ADMINISTRATOR") {
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

  get: async (t: Translaction, id: string) => {
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

    return {
      success: true,
      status: 200,
      data: enterprise,
    };
  },
};

export default EnterpriseService;
