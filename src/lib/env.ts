import { z } from "zod";

const DEFAULT_DEV_DATABASE_URL =
  "postgresql://taskewr:taskewr@localhost:5433/taskewr?schema=public";
const DEFAULT_DEV_SESSION_SECRET = "taskewr-dev-session-secret";
const DEFAULT_DEV_SMTP_HOST = "localhost";
const DEFAULT_DEV_SMTP_PORT = 1025;
const DEFAULT_DEV_SMTP_FROM = "Taskewr <no-reply@taskewr.local>";
const DEFAULT_NOTIFICATION_WORKER_POLL_INTERVAL_MS = 60_000;
const DEFAULT_NOTIFICATION_WORKER_BATCH_SIZE = 50;
const DEFAULT_NOTIFICATION_WORKER_MAX_ATTEMPTS = 3;
const DEFAULT_NOTIFICATION_WORKER_CLAIM_TIMEOUT_MS = 300_000;
const DEFAULT_TASK_ATTACHMENT_STORAGE_DIR = ".taskewr/uploads/task-attachments";
const DEFAULT_TASK_ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024;
const BUILD_PHASES = new Set(["phase-production-build"]);
const emptyStringAsUndefined = (value: unknown) => (value === "" ? undefined : value);
const optionalBooleanSchema = z.preprocess((value) => {
  const normalized = emptyStringAsUndefined(value);

  if (typeof normalized !== "string") {
    return normalized;
  }

  if (["true", "1", "yes"].includes(normalized.toLowerCase())) {
    return true;
  }

  if (["false", "0", "no"].includes(normalized.toLowerCase())) {
    return false;
  }

  return normalized;
}, z.boolean().optional());
const optionalNumberSchema = z.preprocess(emptyStringAsUndefined, z.coerce.number().int().positive().optional());

const envSchema = z.object({
  APP_URL: z.preprocess(emptyStringAsUndefined, z.string().url().optional()),
  DATABASE_URL: z.preprocess(emptyStringAsUndefined, z.string().url().optional()),
  NEXT_PHASE: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
  SESSION_SECRET: z.string().optional(),
  SMTP_HOST: z.preprocess(emptyStringAsUndefined, z.string().trim().min(1).optional()),
  SMTP_PORT: optionalNumberSchema,
  SMTP_SECURE: optionalBooleanSchema,
  SMTP_REQUIRE_TLS: optionalBooleanSchema,
  SMTP_USER: z.preprocess(emptyStringAsUndefined, z.string().optional()),
  SMTP_PASSWORD: z.preprocess(emptyStringAsUndefined, z.string().optional()),
  SMTP_FROM: z.preprocess(emptyStringAsUndefined, z.string().trim().min(1).optional()),
  SMTP_REPLY_TO: z.preprocess(emptyStringAsUndefined, z.string().trim().min(1).optional()),
  NOTIFICATION_WORKER_POLL_INTERVAL_MS: optionalNumberSchema,
  NOTIFICATION_WORKER_BATCH_SIZE: optionalNumberSchema,
  NOTIFICATION_WORKER_MAX_ATTEMPTS: optionalNumberSchema,
  NOTIFICATION_WORKER_CLAIM_TIMEOUT_MS: optionalNumberSchema,
  TASK_ATTACHMENT_STORAGE_DIR: z.preprocess(emptyStringAsUndefined, z.string().trim().min(1).optional()),
  TASK_ATTACHMENT_MAX_BYTES: optionalNumberSchema,
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

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  requireTLS: boolean;
  user: string | undefined;
  password: string | undefined;
  from: string;
  replyTo: string | undefined;
};

export function getSmtpConfig(): SmtpConfig {
  const env = readEnv();
  const isProduction = env.NODE_ENV === "production";
  const host = env.SMTP_HOST ?? (isProduction ? undefined : DEFAULT_DEV_SMTP_HOST);
  const port = env.SMTP_PORT ?? (isProduction ? undefined : DEFAULT_DEV_SMTP_PORT);
  const from = env.SMTP_FROM ?? (isProduction ? undefined : DEFAULT_DEV_SMTP_FROM);

  if (!host) {
    throw new Error("SMTP_HOST must be set to send email.");
  }

  if (!port) {
    throw new Error("SMTP_PORT must be set to send email.");
  }

  if (!from) {
    throw new Error("SMTP_FROM must be set to send email.");
  }

  if ((env.SMTP_USER && !env.SMTP_PASSWORD) || (!env.SMTP_USER && env.SMTP_PASSWORD)) {
    throw new Error("SMTP_USER and SMTP_PASSWORD must be set together.");
  }

  return {
    host,
    port,
    secure: env.SMTP_SECURE ?? false,
    requireTLS: env.SMTP_REQUIRE_TLS ?? false,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    from,
    replyTo: env.SMTP_REPLY_TO,
  };
}

export type NotificationWorkerConfig = {
  pollIntervalMs: number;
  batchSize: number;
  maxAttempts: number;
  claimTimeoutMs: number;
};

export function getNotificationWorkerConfig(): NotificationWorkerConfig {
  const env = readEnv();

  return {
    pollIntervalMs:
      env.NOTIFICATION_WORKER_POLL_INTERVAL_MS ??
      DEFAULT_NOTIFICATION_WORKER_POLL_INTERVAL_MS,
    batchSize: env.NOTIFICATION_WORKER_BATCH_SIZE ?? DEFAULT_NOTIFICATION_WORKER_BATCH_SIZE,
    maxAttempts:
      env.NOTIFICATION_WORKER_MAX_ATTEMPTS ?? DEFAULT_NOTIFICATION_WORKER_MAX_ATTEMPTS,
    claimTimeoutMs:
      env.NOTIFICATION_WORKER_CLAIM_TIMEOUT_MS ??
      DEFAULT_NOTIFICATION_WORKER_CLAIM_TIMEOUT_MS,
  };
}

export type TaskAttachmentStorageConfig = {
  storageDir: string;
  maxBytes: number;
};

export function getTaskAttachmentStorageConfig(): TaskAttachmentStorageConfig {
  const env = readEnv();

  return {
    storageDir: env.TASK_ATTACHMENT_STORAGE_DIR ?? DEFAULT_TASK_ATTACHMENT_STORAGE_DIR,
    maxBytes: env.TASK_ATTACHMENT_MAX_BYTES ?? DEFAULT_TASK_ATTACHMENT_MAX_BYTES,
  };
}
