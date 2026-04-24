import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/taskewr?schema=public";

const adapter = new PrismaPg({ connectionString });

export const db = globalThis.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}
