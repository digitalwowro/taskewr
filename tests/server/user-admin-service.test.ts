import test from "node:test";
import assert from "node:assert/strict";

import { AuthorizationError, ValidationError } from "@/domain/common/errors";
import { UserAdminService } from "@/server/services/user-admin-service";
import { verifyPassword } from "@/lib/auth";

function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 9,
    name: "User",
    email: "user@taskewr.com",
    avatarUrl: null,
    timezone: "UTC",
    appRole: "user",
    deactivatedAt: null,
    createdAt: new Date("2026-04-01T00:00:00.000Z"),
    updatedAt: new Date("2026-04-01T00:00:00.000Z"),
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

function buildService(repository: Record<string, unknown>, context = buildContext()) {
  return new UserAdminService(repository as never, {
    getAppContext: async () => context,
  } as never);
}

test("non-admins cannot manage users", async () => {
  const service = buildService(
    {
      listUsers: async () => [],
    },
    buildContext({ appRole: "user" }),
  );

  await assert.rejects(
    () => service.listUsers(),
    (error) => error instanceof AuthorizationError && error.code === "user_management_denied",
  );
});

test("createUser normalizes email and hashes the temporary password", async () => {
  const createdData: Record<string, unknown>[] = [];
  const service = buildService({
    findByEmail: async () => null,
    create: async (data: Record<string, unknown>) => {
      createdData[0] = data;
      return buildUser({
        id: 12,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        appRole: data.appRole,
      });
    },
  });

  const user = await service.createUser({
    name: "  Example User  ",
    email: " Example@Taskewr.COM ",
    password: "taskewr1",
    timezone: "",
    appRole: "admin",
  });

  assert.equal(user.email, "example@taskewr.com");
  assert.equal(user.name, "Example User");
  assert.equal(user.appRole, "admin");
  assert.ok(createdData[0]);
  assert.equal(createdData[0].timezone, null);
  assert.equal(verifyPassword("taskewr1", createdData[0].passwordHash as string), true);
});

test("createUser rejects duplicate email addresses", async () => {
  const service = buildService({
    findByEmail: async () => buildUser({ id: 3 }),
  });

  await assert.rejects(
    () =>
      service.createUser({
        name: "User",
        email: "user@taskewr.com",
        password: "taskewr1",
        appRole: "user",
      }),
    (error) => error instanceof ValidationError && error.code === "user_email_taken",
  );
});

test("updateUser rejects duplicate email addresses", async () => {
  const service = buildService({
    findById: async () => buildUser({ id: 9, email: "user@taskewr.com" }),
    findByEmail: async () => buildUser({ id: 10, email: "taken@taskewr.com" }),
  });

  await assert.rejects(
    () => service.updateUser(9, { email: "taken@taskewr.com" }),
    (error) => error instanceof ValidationError && error.code === "user_email_taken",
  );
});

test("admins cannot deactivate themselves", async () => {
  const service = buildService({
    findById: async () => buildUser({ id: 7, appRole: "admin" }),
  });

  await assert.rejects(
    () => service.deactivateUser(7),
    (error) => error instanceof ValidationError && error.code === "user_self_deactivate",
  );
});

test("admins cannot deactivate the last active admin", async () => {
  const service = buildService({
    findById: async () => buildUser({ id: 8, appRole: "admin" }),
    countActiveAdmins: async () => 1,
  });

  await assert.rejects(
    () => service.deactivateUser(8),
    (error) => error instanceof ValidationError && error.code === "user_last_admin",
  );
});

test("admin password reset does not require the target user's current password", async () => {
  let passwordHash: string | null = null;
  const service = buildService({
    findById: async () => buildUser({ id: 8 }),
    updateById: async (_id: number, data: Record<string, unknown>) => {
      passwordHash = data.passwordHash as string;
      return buildUser({ id: 8, passwordHash });
    },
  });

  await service.resetPassword(8, { password: "newpass1" });

  assert.equal(verifyPassword("newpass1", passwordHash), true);
});
