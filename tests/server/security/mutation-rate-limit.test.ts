import test from "node:test";
import assert from "node:assert/strict";

import { RateLimitError } from "@/domain/common/errors";
import {
  assertMutationRateLimit,
  FixedWindowRateLimiter,
} from "@/server/security/mutation-rate-limit";

test("fixed window mutation limiter blocks after the configured request count", () => {
  const limiter = new FixedWindowRateLimiter({
    maxRequests: 2,
    windowMs: 60_000,
    now: () => 1_000,
  });

  limiter.consume("tasks:create:user:1");
  limiter.consume("tasks:create:user:1");

  assert.throws(() => limiter.consume("tasks:create:user:1"), RateLimitError);
  assert.doesNotThrow(() => limiter.consume("tasks:update:user:1"));
});

test("fixed window mutation limiter resets after the configured window", () => {
  let now = 1_000;
  const limiter = new FixedWindowRateLimiter({
    maxRequests: 1,
    windowMs: 5_000,
    now: () => now,
  });

  limiter.consume("projects:create:user:1");
  now = 7_000;

  assert.doesNotThrow(() => limiter.consume("projects:create:user:1"));
});

test("assertMutationRateLimit keys authenticated requests by user and workspace", async () => {
  const limiter = new FixedWindowRateLimiter({
    maxRequests: 1,
    windowMs: 60_000,
    now: () => 1_000,
  });
  const authService = {
    getSession: async () => ({
      userId: "user-1",
      workspaceId: "workspace-1",
      email: "account@taskewr.com",
    }),
  };
  const request = new Request("http://taskewr.test/api/v1/tasks");

  await assertMutationRateLimit(request, "tasks:create", authService, limiter);

  await assert.rejects(
    () => assertMutationRateLimit(request, "tasks:create", authService, limiter),
    RateLimitError,
  );
  await assert.doesNotReject(() =>
    assertMutationRateLimit(request, "tasks:update", authService, limiter),
  );
});

test("assertMutationRateLimit falls back to client IP without a session", async () => {
  const limiter = new FixedWindowRateLimiter({
    maxRequests: 1,
    windowMs: 60_000,
    now: () => 1_000,
  });
  const authService = {
    getSession: async () => null,
  };
  const request = new Request("http://taskewr.test/api/v1/tasks", {
    headers: {
      "x-forwarded-for": "203.0.113.10, 203.0.113.11",
    },
  });

  await assertMutationRateLimit(request, "tasks:create", authService, limiter);

  await assert.rejects(
    () => assertMutationRateLimit(request, "tasks:create", authService, limiter),
    RateLimitError,
  );
});
