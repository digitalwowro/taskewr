import "dotenv/config";

import { defineConfig } from "prisma/config";

const buildTimeFallbackUrl =
  "postgresql://placeholder:placeholder@localhost:5432/taskewr?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? buildTimeFallbackUrl,
  },
});
