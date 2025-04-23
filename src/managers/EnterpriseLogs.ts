import logger from "@/utils/logger";
import prisma from "@/utils/prisma";
import { Prisma } from "@prisma/client";

export type EnterpriseWithLogs = Prisma.EnterpriseGetPayload<{
  include: { logs: true };
}>;

type tags =
  | "NEW_INVOICE"
  | "NEW_SUBUSER"
  | "EDIT_SUBUSER"
  | "REMOVE_SUBUSER"
  | "NEW_POST"
  | "EDIT_POST"
  | "REMOVE_POST";

type newLogs = {
  userId: string;
  title: string;
  userName: string;
  tag: tags;
}[];

export default class EnterpriseLogs {
  private enterprise: EnterpriseWithLogs;
  private logs: EnterpriseWithLogs["logs"];
  private newLogs: newLogs = [];

  constructor(enterprise: EnterpriseWithLogs) {
    this.enterprise = enterprise;
    this.logs = enterprise.logs;
  }

  getLogs() {
    return this.logs;
  }

  getNewLogs() {
    return this.newLogs;
  }

  addLogs(...logs: newLogs) {
    this.newLogs.push(...logs);
  }

  setNewLogs(logs: newLogs) {
    this.newLogs = logs;
  }

  async save() {
    const logs = this.newLogs;

    try {
      await prisma.log.createMany({
        data: logs.map(log => ({
          title: log.title,
          userName: log.userName,
          userId: log.userId,
          tag: log.tag,
          enterpriseId: this.enterprise.id,
        })),
        skipDuplicates: true,
      });

      this.newLogs = [];

      return true;
    } catch (error) {
      logger.error(error);
      return false;
    }
  }
}
