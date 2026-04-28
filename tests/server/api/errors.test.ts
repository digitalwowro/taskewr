import test from "node:test";
import assert from "node:assert/strict";

import {
  AuthenticationError,
  AuthorizationError,
  DomainError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "@/domain/common/errors";
import { toErrorResponse } from "@/server/api/errors";

async function readJson(response: Response) {
  return (await response.json()) as { error: string; code: string };
}

test("toErrorResponse maps validation failures to 400", async () => {
  const response = toErrorResponse(new ValidationError("Bad input", "bad_input"));

  assert.equal(response.status, 400);
  assert.deepEqual(await readJson(response), {
    error: "Bad input",
    code: "bad_input",
  });
});

test("toErrorResponse maps authentication failures to 401", async () => {
  const response = toErrorResponse(new AuthenticationError("Login required", "auth_required"));

  assert.equal(response.status, 401);
  assert.deepEqual(await readJson(response), {
    error: "Login required",
    code: "auth_required",
  });
});

test("toErrorResponse maps authorization failures to 403", async () => {
  const response = toErrorResponse(new AuthorizationError("Forbidden", "forbidden"));

  assert.equal(response.status, 403);
  assert.deepEqual(await readJson(response), {
    error: "Forbidden",
    code: "forbidden",
  });
});

test("toErrorResponse maps not found failures to 404", async () => {
  const response = toErrorResponse(new NotFoundError("Missing", "missing"));

  assert.equal(response.status, 404);
  assert.deepEqual(await readJson(response), {
    error: "Missing",
    code: "missing",
  });
});

test("toErrorResponse maps other domain failures to 422", async () => {
  const response = toErrorResponse(new DomainError("Conflict", "domain_conflict"));

  assert.equal(response.status, 422);
  assert.deepEqual(await readJson(response), {
    error: "Conflict",
    code: "domain_conflict",
  });
});

test("toErrorResponse maps rate limit failures to 429", async () => {
  const response = toErrorResponse(new RateLimitError("Too many attempts", "login_rate_limited"));

  assert.equal(response.status, 429);
  assert.deepEqual(await readJson(response), {
    error: "Too many attempts",
    code: "login_rate_limited",
  });
});
