import assert from "node:assert/strict";
import test from "node:test";

import { RateLimitError } from "@/domain/common/errors";
import { PasswordResetRateLimiter } from "@/server/security/password-reset-rate-limit";

test("password reset limiter blocks repeated requests for the same IP and email", () => {
  const limiter = new PasswordResetRateLimiter({
    maxRequests: 2,
    windowMs: 60_000,
    now: () => 1_000,
  });
  const input = {
    email: "USER@example.com",
    ip: "203.0.113.10",
  };

  limiter.consume(input);
  limiter.consume({ ...input, email: " user@EXAMPLE.com " });

  assert.throws(
    () => limiter.consume(input),
    (error) => error instanceof RateLimitError && error.code === "password_reset_rate_limited",
  );
});

test("password reset limiter expires request windows", () => {
  let now = 1_000;
  const limiter = new PasswordResetRateLimiter({
    maxRequests: 1,
    windowMs: 60_000,
    now: () => now,
  });
  const input = {
    email: "account@taskewr.com",
    ip: "203.0.113.10",
  };

  limiter.consume(input);
  now += 60_001;
  limiter.consume(input);
});
