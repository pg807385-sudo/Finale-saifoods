import { PrismaClient } from "@prisma/client";
import { config } from "./index";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: config.nodeEnv === "development" ? ["query", "error", "warn"] : ["error"],
});

if (config.nodeEnv !== "production") globalForPrisma.prisma = prisma;
