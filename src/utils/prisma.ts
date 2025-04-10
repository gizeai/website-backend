/* eslint-disable @typescript-eslint/ban-ts-comment */
import { PrismaClient } from "@prisma/client";

//@ts-ignore
let prisma: PrismaClient | null = global.prisma ?? null;

// @ts-ignore
if (!global.prisma) {
  prisma = new PrismaClient();
  // @ts-ignore
  global.prisma = prisma;
}

export default prisma as PrismaClient;
