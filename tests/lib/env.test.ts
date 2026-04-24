import test from "node:test";
import assert from "node:assert/strict";

import { getDatabaseUrl, getSessionSecret } from "@/lib/env";

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
