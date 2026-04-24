import { z } from "zod";

const DEFAULT_DEV_DATABASE_URL =
  "postgresql://taskewr:taskewr@localhost:5433/taskewr?schema=public";
const DEFAULT_DEV_SESSION_SECRET = "taskewr-dev-session-secret";
const BUILD_PHASES = new Set(["phase-production-build"]);
const emptyStringAsUndefined = (value: unknown) => (value === "" ? undefined : value);

const envSchema = z.object({
  APP_URL: z.preprocess(emptyStringAsUndefined, z.string().url().optional()),
  DATABASE_URL: z.preprocess(emptyStringAsUndefined, z.string().url().optional()),
  NEXT_PHASE: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
  SESSION_SECRET: z.string().optional(),
});

function readEnv() {
  return envSchema.parse(process.env);
}

function isProductionBuildPhase(env: z.infer<typeof envSchema>) {
  return env.NODE_ENV === "production" && BUILD_PHASES.has(env.NEXT_PHASE ?? "");
}

export function getDatabaseUrl() {
  const env = readEnv();

  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  if (env.NODE_ENV === "production" && !isProductionBuildPhase(env)) {
    throw new Error("DATABASE_URL must be set in production.");
  }

  return DEFAULT_DEV_DATABASE_URL;
}

export function getSessionSecret() {
  const env = readEnv();

  if (env.SESSION_SECRET) {
    if (env.NODE_ENV === "production" && env.SESSION_SECRET.length < 32) {
      throw new Error("SESSION_SECRET must be at least 32 characters in production.");
    }

    return env.SESSION_SECRET;
  }

  if (env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production.");
  }

  return DEFAULT_DEV_SESSION_SECRET;
}

export function getAppUrl() {
  const env = readEnv();
  return env.APP_URL ?? "http://localhost:3000";
}
