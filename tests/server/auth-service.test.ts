import test from "node:test";
import assert from "node:assert/strict";

import { AuthService } from "@/server/services/auth-service";
import { ValidationError } from "@/domain/common/errors";
import { hashPassword } from "@/lib/auth";
import type { SessionPayload } from "@/types/auth";

class TestAuthService extends AuthService {
  constructor(
    database: ConstructorParameters<typeof AuthService>[0],
    private readonly session: SessionPayload | null,
  ) {
    super(database);
  }

  override async getSession() {
    return this.session;
  }
}

function buildSession(overrides: Partial<SessionPayload> = {}): SessionPayload {
  return {
    userId: 7,
    workspaceId: 3,
    workspaceRole: "owner",
    timezone: "Europe/Bucharest",
    issuedAt: Date.now(),
    ...overrides,
  };
}

test("loginWithPassword returns the single workspace membership", async () => {
  const authService = new AuthService({
    user: {
      findUnique: async () => ({
        id: 7,
        passwordHash: hashPassword("taskewr"),
        timezone: "Europe/Bucharest",
        memberships: [
          {
            workspaceId: 3,
            role: "owner",
            workspace: {
              id: 3,
            },
          },
        ],
      }),
    },
  });

  const session = await authService.loginWithPassword({
    email: "account@taskewr.com",
    password: "taskewr",
  });

  assert.equal(session.userId, 7);
  assert.equal(session.workspaceId, 3);
  assert.equal(session.workspaceRole, "owner");
});

test("loginWithPassword rejects accounts with multiple workspace memberships", async () => {
  const authService = new AuthService({
    user: {
      findUnique: async () => ({
        id: 7,
        passwordHash: hashPassword("taskewr"),
        timezone: "Europe/Bucharest",
        memberships: [
          {
            workspaceId: 3,
            role: "owner",
            workspace: {
              id: 3,
            },
          },
          {
            workspaceId: 4,
            role: "owner",
            workspace: {
              id: 4,
            },
          },
        ],
      }),
    },
  });

  await assert.rejects(
    () => authService.loginWithPassword({ email: "account@taskewr.com", password: "taskewr" }),
    (error) => error instanceof ValidationError && error.code === "multiple_workspaces_not_supported",
  );
});

test("getAuthenticatedActor rejects stale sessions without a backing user", async () => {
  const authService = new TestAuthService(
    {
      user: {
        findUnique: async () => null,
      },
    },
    buildSession(),
  );

  assert.equal(await authService.getAuthenticatedActor(), null);
});

test("getAuthenticatedActor rejects stale sessions without workspace membership", async () => {
  const authService = new TestAuthService(
    {
      user: {
        findUnique: async () => ({
          timezone: "Europe/Bucharest",
          memberships: [],
        }),
      },
    },
    buildSession(),
  );

  assert.equal(await authService.getAuthenticatedActor(), null);
});

test("getAuthenticatedActor returns current user and membership data", async () => {
  const authService = new TestAuthService(
    {
      user: {
        findUnique: async () => ({
          timezone: "UTC",
          memberships: [
            {
              workspaceId: 3,
              role: "owner",
            },
          ],
        }),
      },
    },
    buildSession({ timezone: "Europe/Bucharest" }),
  );

  assert.deepEqual(await authService.getAuthenticatedActor(), {
    userId: 7,
    workspaceId: 3,
    workspaceRole: "owner",
    timezone: "UTC",
  });
});
