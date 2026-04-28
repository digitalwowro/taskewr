import test from "node:test";
import assert from "node:assert/strict";

import { RateLimitError } from "@/domain/common/errors";
import { getClientIp, LoginRateLimiter } from "@/server/security/login-rate-limit";

test("login rate limiter blocks after repeated failures for the same IP and email", () => {
  const limiter = new LoginRateLimiter({
    maxAttempts: 3,
    windowMs: 60_000,
    now: () => 1_000,
  });
  const input = {
    email: "USER@example.com",
    ip: "192.0.2.10",
  };

  limiter.recordFailure(input);
  limiter.recordFailure({ ...input, email: " user@EXAMPLE.com " });

  assert.throws(() => limiter.recordFailure(input), RateLimitError);
  assert.throws(() => limiter.assertAllowed(input), RateLimitError);
});

test("login rate limiter resets after a successful login", () => {
  const limiter = new LoginRateLimiter({
    maxAttempts: 2,
    windowMs: 60_000,
    now: () => 1_000,
  });
  const input = {
    email: "account@taskewr.com",
    ip: "192.0.2.20",
  };

  limiter.recordFailure(input);
  limiter.recordSuccess(input);

  assert.doesNotThrow(() => limiter.assertAllowed(input));
  limiter.recordFailure(input);
  assert.doesNotThrow(() => limiter.assertAllowed(input));
});

test("login rate limiter expires failed attempts after the configured window", () => {
  let now = 1_000;
  const limiter = new LoginRateLimiter({
    maxAttempts: 2,
    windowMs: 5_000,
    now: () => now,
  });
  const input = {
    email: "account@taskewr.com",
    ip: "192.0.2.30",
  };

  limiter.recordFailure(input);
  now = 7_000;

  assert.doesNotThrow(() => limiter.assertAllowed(input));
  limiter.recordFailure(input);
  assert.doesNotThrow(() => limiter.assertAllowed(input));
});

test("getClientIp prefers forwarded headers", () => {
  assert.equal(
    getClientIp(new Headers({ "x-forwarded-for": "203.0.113.10, 203.0.113.11" })),
    "203.0.113.10",
  );
  assert.equal(getClientIp(new Headers({ "x-real-ip": "203.0.113.20" })), "203.0.113.20");
  assert.equal(
    getClientIp(new Headers({ "cf-connecting-ip": "203.0.113.30" })),
    "203.0.113.30",
  );
  assert.equal(getClientIp(new Headers()), "unknown");
});
