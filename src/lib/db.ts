import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "@/generated/prisma/client";
import { getDatabaseUrl } from "@/lib/env";

declare global {
  var pgPool: Pool | undefined;
  var prisma: PrismaClient | undefined;
}

const pool = globalThis.pgPool ?? new Pool({ connectionString: getDatabaseUrl() });
const adapter = new PrismaPg(pool);

export const db = globalThis.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.pgPool = pool;
  globalThis.prisma = db;
}
