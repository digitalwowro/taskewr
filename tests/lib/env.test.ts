import test from "node:test";
import assert from "node:assert/strict";

import {
  getDatabaseUrl,
  getNotificationWorkerConfig,
  getSessionSecret,
  getSmtpConfig,
} from "@/lib/env";

const originalEnv = { ...process.env };

function withEnv(env: NodeJS.ProcessEnv, callback: () => void) {
  process.env = { ...originalEnv, ...env };

  try {
    callback();
  } finally {
    process.env = { ...originalEnv };
  }
}

test("getDatabaseUrl uses the development fallback outside production", () => {
  withEnv(
    {
      DATABASE_URL: "",
      NODE_ENV: "development",
    },
    () => {
      assert.equal(
        getDatabaseUrl(),
        "postgresql://taskewr:taskewr@localhost:5433/taskewr?schema=public",
      );
    },
  );
});

test("getDatabaseUrl requires DATABASE_URL in production runtime", () => {
  withEnv(
    {
      DATABASE_URL: "",
      NEXT_PHASE: "",
      NODE_ENV: "production",
    },
    () => {
      assert.throws(() => getDatabaseUrl(), /DATABASE_URL must be set/);
    },
  );
});

test("getSessionSecret requires a strong production secret", () => {
  withEnv(
    {
      NODE_ENV: "production",
      SESSION_SECRET: "",
    },
    () => {
      assert.throws(() => getSessionSecret(), /SESSION_SECRET must be set/);
    },
  );

  withEnv(
    {
      NODE_ENV: "production",
      SESSION_SECRET: "short",
    },
    () => {
      assert.throws(() => getSessionSecret(), /at least 32 characters/);
    },
  );
});

test("getSmtpConfig uses Mailpit defaults outside production", () => {
  withEnv(
    {
      NODE_ENV: "development",
      SMTP_HOST: "",
      SMTP_PORT: "",
      SMTP_SECURE: "",
      SMTP_REQUIRE_TLS: "",
      SMTP_USER: "",
      SMTP_PASSWORD: "",
      SMTP_FROM: "",
      SMTP_REPLY_TO: "",
    },
    () => {
      assert.deepEqual(getSmtpConfig(), {
        host: "localhost",
        port: 1025,
        secure: false,
        requireTLS: false,
        user: undefined,
        password: undefined,
        from: "Taskewr <no-reply@taskewr.local>",
        replyTo: undefined,
      });
    },
  );
});

test("getSmtpConfig parses SMTP env credentials and TLS flags", () => {
  withEnv(
    {
      NODE_ENV: "production",
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "465",
      SMTP_SECURE: "true",
      SMTP_REQUIRE_TLS: "false",
      SMTP_USER: "mailer",
      SMTP_PASSWORD: "secret",
      SMTP_FROM: "Taskewr <taskewr@example.com>",
      SMTP_REPLY_TO: "support@example.com",
    },
    () => {
      assert.deepEqual(getSmtpConfig(), {
        host: "smtp.example.com",
        port: 465,
        secure: true,
        requireTLS: false,
        user: "mailer",
        password: "secret",
        from: "Taskewr <taskewr@example.com>",
        replyTo: "support@example.com",
      });
    },
  );
});

test("getSmtpConfig requires paired SMTP credentials", () => {
  withEnv(
    {
      NODE_ENV: "production",
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_FROM: "Taskewr <taskewr@example.com>",
      SMTP_USER: "mailer",
      SMTP_PASSWORD: "",
    },
    () => {
      assert.throws(() => getSmtpConfig(), /SMTP_USER and SMTP_PASSWORD/);
    },
  );
});

test("getNotificationWorkerConfig parses worker tuning env", () => {
  withEnv(
    {
      NODE_ENV: "test",
      NOTIFICATION_WORKER_POLL_INTERVAL_MS: "30000",
      NOTIFICATION_WORKER_BATCH_SIZE: "25",
      NOTIFICATION_WORKER_MAX_ATTEMPTS: "5",
      NOTIFICATION_WORKER_CLAIM_TIMEOUT_MS: "120000",
    },
    () => {
      assert.deepEqual(getNotificationWorkerConfig(), {
        pollIntervalMs: 30_000,
        batchSize: 25,
        maxAttempts: 5,
        claimTimeoutMs: 120_000,
      });
    },
  );
});
