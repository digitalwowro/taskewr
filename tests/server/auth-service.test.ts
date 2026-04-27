import test from "node:test";
import assert from "node:assert/strict";

import { AuthService } from "@/server/services/auth-service";
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

test("getAuthenticatedActor rejects stale sessions without a backing user", async () => {
  const authService = new TestAuthService(
    {
      user: {
        findUnique: async () => null,
      } as never,
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
      } as never,
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
      } as never,
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
