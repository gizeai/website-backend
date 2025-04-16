import { PlansNamesTypes } from "@/constants/PLANS";
import Cart, { recurrencesType } from "@/managers/Cart";
import { Quotes } from "@/types/quotes";
import getQuotes from "@/utils/getQuotes";
import prisma from "@/utils/prisma";
import { Enterprise, User } from "@prisma/client";
import { TFunction } from "i18next";

type Translaction = TFunction<"translation", undefined>;

const InvoiceService = {
  create: async (
    enterprise: Enterprise,
    plan: PlansNamesTypes,
    recurrence: recurrencesType,
    currency: keyof Quotes["rates"]
  ) => {
    const price = Cart.getPrice(plan, recurrence);
    const quotes = await getQuotes();

    const invoice = await prisma.invoice.create({
      data: {
        enterpriseId: enterprise.id,
        value: price * (quotes?.rates[currency] ?? 1),
        enterpriseName: enterprise.name,
        expireAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        status: "PENDING",
        currency: currency,
      },
    });

    return {
      success: true,
      status: 200,
      data: invoice,
    };
  },

  get: async (t: Translaction, id: string) => {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: id,
      },
    });

    if (!invoice) {
      return {
        success: false,
        status: 404,
        data: { error: t("invoice.not_found") },
      };
    }

    return {
      success: true,
      status: 200,
      data: invoice,
    };
  },

  getAllByUser: async (user: User) => {
    const enterprises = await prisma.enterprise.findMany({
      where: {
        user: { id: user.id },
      },
      select: { id: true },
    });

    const invoices = await prisma.invoice.findMany({
      where: {
        enterpriseId: {
          in: enterprises.map(enterprise => enterprise.id),
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return {
      success: true,
      status: 200,
      data: invoices,
    };
  },

  getAllByEnterprise: async (enterprise: Enterprise) => {
    const invoices = await prisma.invoice.findMany({
      where: {
        enterpriseId: enterprise.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return {
      success: true,
      status: 200,
      data: invoices,
    };
  },

  delete: async (t: Translaction, user: User | undefined, id: string) => {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: id,
      },
    });

    if (!invoice) {
      return {
        success: false,
        status: 404,
        data: { error: t("invoice.not_found") },
      };
    }

    const enterprise = await prisma.enterprise.findUnique({
      where: {
        id: invoice.enterpriseId,
      },
    });

    if (!enterprise) {
      return {
        success: false,
        status: 403,
        data: { error: t("invoice.not_enterprise") },
      };
    }

    if (enterprise.userId !== (user as User | undefined)?.id) {
      return {
        success: false,
        status: 403,
        data: { error: t("general_erros.not_permission_to_action") },
      };
    }

    await prisma.invoice.delete({
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
};

export default InvoiceService;
