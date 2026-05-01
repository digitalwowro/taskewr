import assert from "node:assert/strict";
import test from "node:test";

import { AuthorizationError, ValidationError } from "@/domain/common/errors";
import { hashPasswordResetToken } from "@/lib/password-reset-tokens";
import { verifyPassword } from "@/lib/auth";
import { PasswordResetService } from "@/server/services/password-reset-service";

type TestEmailSender = (input: { to: string; name: string; token: string }) => Promise<void>;

function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 12,
    name: "Taskewr User",
    email: "user@taskewr.com",
    deactivatedAt: null,
    ...overrides,
  };
}

function buildContext(overrides: Record<string, unknown> = {}) {
  return {
    workspaceId: 1,
    actorUserId: 7,
    workspaceRole: "owner",
    appRole: "admin",
    workspaces: [],
    accessibleWorkspaceIds: [1],
    accessibleProjectIds: [],
    timezone: "UTC",
    ...overrides,
  };
}

function buildService(
  repository: Record<string, unknown>,
  emailSender: TestEmailSender = async () => undefined,
  context = buildContext(),
) {
  return new PasswordResetService(
    repository as never,
    {
      getAppContext: async () => context,
    } as never,
    emailSender as never,
  );
}

test("requestPasswordReset creates a hashed token and sends email for active users", async () => {
  let tokenRecord: Record<string, unknown> | null = null;
  let sentEmail: { to: string; name: string; token: string } | null = null;
  const service = buildService(
    {
      findUserByEmail: async (email: string) => {
        assert.equal(email, "user@taskewr.com");
        return buildUser();
      },
      createToken: async (data: Record<string, unknown>) => {
        tokenRecord = data;
        return { id: 1, ...data };
      },
    },
    async (input: { to: string; name: string; token: string }) => {
      sentEmail = input;
    },
  );

  const result = await service.requestPasswordReset(
    { email: " User@Taskewr.COM " },
    { ip: "203.0.113.10", userAgent: "test-agent" },
  );
  const sent = sentEmail as { to: string; name: string; token: string } | null;
  const tokenData = tokenRecord as Record<string, unknown> | null;

  assert.equal(result.ok, true);
  assert.ok(sent);
  assert.ok(tokenData);
  assert.equal(sent.to, "user@taskewr.com");
  assert.ok(sent.token);
  assert.equal(tokenData.userId, 12);
  assert.equal(tokenData.tokenHash, hashPasswordResetToken(sent.token));
  assert.equal(tokenData.requestIp, "203.0.113.10");
  assert.equal(tokenData.requestUserAgent, "test-agent");
  assert.ok(tokenData.expiresAt instanceof Date);
});

test("requestPasswordReset returns the same response without sending for missing or inactive users", async () => {
  let createCount = 0;
  let sendCount = 0;
  const service = buildService(
    {
      findUserByEmail: async () => null,
      createToken: async () => {
        createCount += 1;
      },
    },
    async () => {
      sendCount += 1;
    },
  );
  const inactiveService = buildService(
    {
      findUserByEmail: async () => buildUser({ deactivatedAt: new Date() }),
      createToken: async () => {
        createCount += 1;
      },
    },
    async () => {
      sendCount += 1;
    },
  );

  assert.equal((await service.requestPasswordReset({ email: "missing@taskewr.com" })).ok, true);
  assert.equal((await inactiveService.requestPasswordReset({ email: "user@taskewr.com" })).ok, true);
  assert.equal(createCount, 0);
  assert.equal(sendCount, 0);
});

test("requestPasswordReset hides email delivery failures in the public flow", async () => {
  let createCount = 0;
  const originalConsoleError = console.error;
  console.error = () => undefined;
  const service = buildService(
    {
      findUserByEmail: async () => buildUser(),
      createToken: async () => {
        createCount += 1;
      },
    },
    async () => {
      throw new Error("SMTP unavailable");
    },
  );

  try {
    const result = await service.requestPasswordReset({ email: "user@taskewr.com" });

    assert.equal(result.ok, true);
    assert.equal(createCount, 1);
  } finally {
    console.error = originalConsoleError;
  }
});

test("confirmPasswordReset consumes a valid token and hashes the new password", async () => {
  let consumed: Record<string, unknown> | null = null;
  const service = buildService({
    consumeTokenAndUpdatePassword: async (input: Record<string, unknown>) => {
      consumed = input;
      return { userId: 12 };
    },
  });

  const result = await service.confirmPasswordReset({
    token: "a".repeat(64),
    password: "newpass1",
  });
  const consumedInput = consumed as Record<string, unknown> | null;

  assert.equal(result.ok, true);
  assert.ok(consumedInput);
  assert.equal(consumedInput.tokenHash, hashPasswordResetToken("a".repeat(64)));
  assert.equal(verifyPassword("newpass1", consumedInput.passwordHash as string), true);
  assert.ok(consumedInput.now instanceof Date);
});

test("confirmPasswordReset rejects invalid or used tokens", async () => {
  const service = buildService({
    consumeTokenAndUpdatePassword: async () => null,
  });

  await assert.rejects(
    () =>
      service.confirmPasswordReset({
        token: "a".repeat(64),
        password: "newpass1",
      }),
    (error) =>
      error instanceof ValidationError && error.code === "password_reset_token_invalid",
  );
});

test("admin reset emails require app admin access and surface delivery failures", async () => {
  const service = buildService(
    {
      findUserById: async () => buildUser(),
      createToken: async () => ({ id: 1 }),
    },
    async () => {
      throw new Error("SMTP unavailable");
    },
  );
  const nonAdminService = buildService(
    {
      findUserById: async () => buildUser(),
      createToken: async () => ({ id: 1 }),
    },
    async () => undefined,
    buildContext({ appRole: "user" }),
  );

  await assert.rejects(
    () => nonAdminService.sendAdminPasswordResetEmail(12),
    (error) => error instanceof AuthorizationError && error.code === "user_management_denied",
  );
  await assert.rejects(
    () => service.sendAdminPasswordResetEmail(12),
    (error) => error instanceof Error && error.message === "SMTP unavailable",
  );
});

test("admin reset emails reject inactive users", async () => {
  const service = buildService({
    findUserById: async () => buildUser({ deactivatedAt: new Date() }),
  });

  await assert.rejects(
    () => service.sendAdminPasswordResetEmail(12),
    (error) => error instanceof ValidationError && error.code === "password_reset_user_inactive",
  );
});
