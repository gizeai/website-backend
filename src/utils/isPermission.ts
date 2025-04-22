import { Enterprise, User } from "@prisma/client";
import prisma from "./prisma";

export default function isPermission(enterprise: Enterprise, user: User) {
  return {
    isAdministrator: async () => {
      if (enterprise.userId === user.id) {
        return true;
      }

      const subuser = await prisma.subuser.findFirst({
        where: {
          userId: user.id,
          enterpriseId: enterprise.id,
        },
      });

      return subuser?.permission === "ADMINISTRATOR";
    },

    isUser: async () => {
      if (enterprise.userId === user.id) {
        return true;
      }

      const subuser = await prisma.subuser.findFirst({
        where: {
          userId: user.id,
          enterpriseId: enterprise.id,
        },
      });

      return subuser?.permission === "USER";
    },
  };
}
