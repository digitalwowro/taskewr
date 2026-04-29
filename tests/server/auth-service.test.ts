import test from "node:test";
import assert from "node:assert/strict";

import { AuthService } from "@/server/services/auth-service";
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
  const session: SessionPayload = {
    userId: 7,
    workspaceId: 3,
    workspaceRole: "owner",
    appRole: "admin",
    timezone: "Europe/Bucharest",
    issuedAt: Date.now(),
  };

  return { ...session, ...overrides };
}

test("loginWithPassword returns the single workspace membership", async () => {
  const authService = new AuthService({
    user: {
      findUnique: async () => ({
        id: 7,
        passwordHash: hashPassword("taskewr"),
        timezone: "Europe/Bucharest",
        appRole: "admin",
        deactivatedAt: null,
        memberships: [
          {
            workspaceId: 3,
            role: "owner",
            workspace: {
              id: 3,
              name: "Work",
              slug: "work",
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
  assert.equal(session.appRole, "admin");
});

test("loginWithPassword uses the first workspace when multiple memberships exist", async () => {
  const authService = new AuthService({
    user: {
      findUnique: async () => ({
        id: 7,
        passwordHash: hashPassword("taskewr"),
        timezone: "Europe/Bucharest",
        appRole: "user",
        deactivatedAt: null,
        memberships: [
          {
            workspaceId: 3,
            role: "owner",
            workspace: {
              id: 3,
              name: "Work",
              slug: "work",
            },
          },
          {
            workspaceId: 4,
            role: "owner",
            workspace: {
              id: 4,
              name: "Personal",
              slug: "personal",
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

  assert.equal(session.workspaceId, 3);
  assert.equal(session.workspaceRole, "owner");
  assert.equal(session.appRole, "user");
});

test("loginWithPassword rejects deactivated users", async () => {
  const authService = new AuthService({
    user: {
      findUnique: async () => ({
        id: 7,
        passwordHash: hashPassword("taskewr"),
        timezone: "Europe/Bucharest",
        appRole: "user",
        deactivatedAt: new Date(),
        memberships: [
          {
            workspaceId: 3,
            role: "owner",
            workspace: {
              id: 3,
              name: "Work",
              slug: "work",
            },
          },
        ],
      }),
    },
  });

  await assert.rejects(
    () =>
      authService.loginWithPassword({
        email: "account@taskewr.com",
        password: "taskewr",
      }),
    (error) => error instanceof Error && error.message === "Invalid email or password.",
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
          appRole: "admin",
          deactivatedAt: null,
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
          appRole: "admin",
          deactivatedAt: null,
          memberships: [
            {
              workspaceId: 3,
              role: "owner",
              workspace: {
                name: "Work",
                slug: "work",
              },
            },
            {
              workspaceId: 4,
              role: "member",
              workspace: {
                name: "Personal",
                slug: "personal",
              },
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
    appRole: "admin",
    workspaceMemberships: [
      {
        workspaceId: 3,
        workspaceName: "Work",
        workspaceSlug: "work",
        role: "owner",
      },
      {
        workspaceId: 4,
        workspaceName: "Personal",
        workspaceSlug: "personal",
        role: "member",
      },
    ],
    accessibleWorkspaceIds: [3, 4],
    timezone: "UTC",
  });
});
