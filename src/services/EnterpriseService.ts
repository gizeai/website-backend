import PLANS, { PlansNamesTypes } from "@/constants/PLANS";
import prisma from "@/utils/prisma";
import { Plan, User } from "@prisma/client";
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
        user: { connect: { id: user.id } },
      },
    });

    return {
      success: true,
      status: 200,
      data: enterprise,
    };
  },
};

export default EnterpriseService;
