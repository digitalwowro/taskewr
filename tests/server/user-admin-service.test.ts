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

test("getUserProjectAccess groups project memberships by workspace", async () => {
  const service = buildService({
    listAvailableWorkspacesForUser: async () => [
      {
        id: 3,
        name: "Shared",
        slug: "shared",
      },
    ],
    findProjectAccessById: async () => ({
      id: 9,
      name: "User",
      email: "user@taskewr.com",
      memberships: [
        {
          role: "member",
          workspace: {
            id: 1,
            name: "Work",
            slug: "work",
            projects: [
              {
                id: 14,
                name: "Unassigned project",
                archivedAt: null,
              },
            ],
          },
        },
        {
          role: "member",
          workspace: {
            id: 2,
            name: "Personal",
            slug: "personal",
            projects: [],
          },
        },
      ],
      projectMemberships: [
        {
          role: "member",
          project: {
            id: 12,
            name: "Portal",
            workspaceId: 1,
            archivedAt: null,
          },
        },
        {
          role: "admin",
          project: {
            id: 13,
            name: "Archived rollout",
            workspaceId: 1,
            archivedAt: new Date("2026-04-01T00:00:00.000Z"),
          },
        },
      ],
    }),
  });

  assert.deepEqual(await service.getUserProjectAccess(9), {
    user: {
      id: 9,
      name: "User",
      email: "user@taskewr.com",
    },
    availableWorkspaces: [
      {
        id: 3,
        name: "Shared",
        slug: "shared",
      },
    ],
    workspaces: [
      {
        id: 1,
        name: "Work",
        slug: "work",
        role: "member",
        availableProjects: [
          {
            id: 14,
            name: "Unassigned project",
            isArchived: false,
          },
        ],
        projects: [
          {
            id: 13,
            name: "Archived rollout",
            role: "admin",
            isArchived: true,
          },
          {
            id: 12,
            name: "Portal",
            role: "member",
            isArchived: false,
          },
        ],
      },
      {
        id: 2,
        name: "Personal",
        slug: "personal",
        role: "member",
        availableProjects: [],
        projects: [],
      },
    ],
  });
});

test("getUserProjectAccess requires app admin access", async () => {
  const service = buildService(
    {
      findProjectAccessById: async () => null,
    },
    buildContext({ appRole: "user" }),
  );

  await assert.rejects(
    () => service.getUserProjectAccess(9),
    (error) => error instanceof AuthorizationError && error.code === "user_management_denied",
  );
});

test("addUserProjectAccess creates a project membership and returns refreshed access", async () => {
  const added: { userId: number; projectId: number; role: string }[] = [];
  const service = buildService({
    findProjectAvailableToUser: async () => ({ id: 12 }),
    addProjectMembership: async (userId: number, projectId: number, role: string) => {
      added.push({ userId, projectId, role });
    },
    listAvailableWorkspacesForUser: async () => [],
    findProjectAccessById: async () => ({
      id: 9,
      name: "User",
      email: "user@taskewr.com",
      memberships: [
        {
          role: "member",
          workspace: {
            id: 1,
            name: "Work",
            slug: "work",
            projects: [],
          },
        },
      ],
      projectMemberships: [
        {
          role: "admin",
          project: {
            id: 12,
            name: "Portal",
            workspaceId: 1,
            archivedAt: null,
          },
        },
      ],
    }),
  });

  const access = await service.addUserProjectAccess(9, {
    projectId: 12,
    role: "admin",
  });

  assert.deepEqual(added, [{ userId: 9, projectId: 12, role: "admin" }]);
  assert.deepEqual(access.workspaces[0]?.projects, [
    {
      id: 12,
      name: "Portal",
      role: "admin",
      isArchived: false,
    },
  ]);
});

test("addUserProjectAccess rejects projects outside the user's workspaces", async () => {
  const service = buildService({
    findProjectAvailableToUser: async () => null,
  });

  await assert.rejects(
    () => service.addUserProjectAccess(9, { projectId: 12, role: "member" }),
    (error) => error instanceof ValidationError && error.code === "project_access_not_available",
  );
});

test("addUserWorkspaceAccess creates a workspace membership and returns refreshed access", async () => {
  const added: { userId: number; workspaceId: number; role: string }[] = [];
  const service = buildService({
    findWorkspaceAvailableToUser: async () => ({ id: 2 }),
    addWorkspaceMembership: async (userId: number, workspaceId: number, role: string) => {
      added.push({ userId, workspaceId, role });
    },
    listAvailableWorkspacesForUser: async () => [],
    findProjectAccessById: async () => ({
      id: 9,
      name: "User",
      email: "user@taskewr.com",
      memberships: [
        {
          role: "admin",
          workspace: {
            id: 2,
            name: "Shared",
            slug: "shared",
            projects: [],
          },
        },
      ],
      projectMemberships: [],
    }),
  });

  const access = await service.addUserWorkspaceAccess(9, {
    workspaceId: 2,
    role: "admin",
  });

  assert.deepEqual(added, [{ userId: 9, workspaceId: 2, role: "admin" }]);
  assert.deepEqual(access.workspaces.map((workspace) => workspace.id), [2]);
  assert.deepEqual(access.availableWorkspaces, []);
});

test("addUserWorkspaceAccess rejects unavailable workspaces", async () => {
  const service = buildService({
    findWorkspaceAvailableToUser: async () => null,
  });

  await assert.rejects(
    () => service.addUserWorkspaceAccess(9, { workspaceId: 2, role: "member" }),
    (error) => error instanceof ValidationError && error.code === "workspace_access_not_available",
  );
});

test("removeUserProjectAccess removes a project membership and returns refreshed access", async () => {
  const removed: { userId: number; projectId: number }[] = [];
  const service = buildService({
    findProjectMembership: async () => ({
      role: "member",
      user: {
        deactivatedAt: null,
      },
    }),
    removeProjectMembership: async (userId: number, projectId: number) => {
      removed.push({ userId, projectId });
    },
    listAvailableWorkspacesForUser: async () => [],
    findProjectAccessById: async () => ({
      id: 9,
      name: "User",
      email: "user@taskewr.com",
      memberships: [
        {
          role: "member",
          workspace: {
            id: 1,
            name: "Work",
            slug: "work",
            projects: [],
          },
        },
      ],
      projectMemberships: [],
    }),
  });

  const access = await service.removeUserProjectAccess(9, 12);

  assert.deepEqual(removed, [{ userId: 9, projectId: 12 }]);
  assert.deepEqual(access.workspaces[0]?.projects, []);
});

test("removeUserProjectAccess rejects removing the last active project owner", async () => {
  const service = buildService({
    findProjectMembership: async () => ({
      role: "owner",
      user: {
        deactivatedAt: null,
      },
    }),
    countActiveProjectOwners: async () => 1,
  });

  await assert.rejects(
    () => service.removeUserProjectAccess(9, 12),
    (error) => error instanceof ValidationError && error.code === "project_last_owner",
  );
});

test("removeUserWorkspaceAccess removes a workspace membership and returns refreshed access", async () => {
  const removed: { userId: number; workspaceId: number }[] = [];
  const service = buildService({
    findWorkspaceMembership: async () => ({
      role: "member",
      user: {
        deactivatedAt: null,
      },
    }),
    countUserProjectMembershipsInWorkspace: async () => 0,
    countUserWorkspaceMemberships: async () => 2,
    removeWorkspaceMembership: async (userId: number, workspaceId: number) => {
      removed.push({ userId, workspaceId });
    },
    listAvailableWorkspacesForUser: async () => [
      {
        id: 1,
        name: "Work",
        slug: "work",
      },
    ],
    findProjectAccessById: async () => ({
      id: 9,
      name: "User",
      email: "user@taskewr.com",
      memberships: [
        {
          role: "member",
          workspace: {
            id: 2,
            name: "Personal",
            slug: "personal",
            projects: [],
          },
        },
      ],
      projectMemberships: [],
    }),
  });

  const access = await service.removeUserWorkspaceAccess(9, 1);

  assert.deepEqual(removed, [{ userId: 9, workspaceId: 1 }]);
  assert.deepEqual(access.workspaces.map((workspace) => workspace.id), [2]);
});

test("removeUserWorkspaceAccess rejects workspaces that still have project access", async () => {
  const service = buildService({
    findWorkspaceMembership: async () => ({
      role: "member",
      user: {
        deactivatedAt: null,
      },
    }),
    countUserProjectMembershipsInWorkspace: async () => 1,
  });

  await assert.rejects(
    () => service.removeUserWorkspaceAccess(9, 1),
    (error) => error instanceof ValidationError && error.code === "workspace_member_has_projects",
  );
});

test("removeUserWorkspaceAccess rejects removing the user's last workspace", async () => {
  const service = buildService({
    findWorkspaceMembership: async () => ({
      role: "member",
      user: {
        deactivatedAt: null,
      },
    }),
    countUserProjectMembershipsInWorkspace: async () => 0,
    countUserWorkspaceMemberships: async () => 1,
  });

  await assert.rejects(
    () => service.removeUserWorkspaceAccess(9, 1),
    (error) => error instanceof ValidationError && error.code === "workspace_member_last_workspace",
  );
});

test("createUser normalizes email and hashes the new password", async () => {
  const createdData: Record<string, unknown>[] = [];
  const createdWorkspace: Record<string, unknown>[] = [];
  const service = buildService({
    findByEmail: async () => null,
    workspaceSlugExists: async () => false,
    createWithPersonalWorkspace: async (
      data: Record<string, unknown>,
      workspace: Record<string, unknown>,
    ) => {
      createdData[0] = data;
      createdWorkspace[0] = workspace;
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
  assert.equal(createdWorkspace[0].name, "Example User");
  assert.equal(createdWorkspace[0].slug, "example-user");
  assert.equal(verifyPassword("taskewr1", createdData[0].passwordHash as string), true);
});

test("createUser creates a collision-safe personal workspace slug", async () => {
  const checkedSlugs: string[] = [];
  const createdWorkspaces: Record<string, unknown>[] = [];
  const service = buildService({
    findByEmail: async () => null,
    workspaceSlugExists: async (slug: string) => {
      checkedSlugs.push(slug);
      return slug === "user";
    },
    createWithPersonalWorkspace: async (
      data: Record<string, unknown>,
      workspace: Record<string, unknown>,
    ) => {
      createdWorkspaces.push(workspace);
      return buildUser({
        id: 12,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        appRole: data.appRole,
      });
    },
  });

  await service.createUser({
    name: "User",
    email: "user@taskewr.com",
    password: "taskewr1",
    appRole: "user",
  });

  assert.deepEqual(checkedSlugs, ["user", "user-2"]);
  assert.equal(createdWorkspaces[0]?.slug, "user-2");
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
  let sessionVersionUpdate: unknown = null;
  const service = buildService({
    findById: async () => buildUser({ id: 8 }),
    updateById: async (_id: number, data: Record<string, unknown>) => {
      passwordHash = data.passwordHash as string;
      sessionVersionUpdate = data.sessionVersion;
      return buildUser({ id: 8, passwordHash });
    },
  });

  await service.resetPassword(8, { password: "newpass1" });

  assert.equal(verifyPassword("newpass1", passwordHash), true);
  assert.deepEqual(sessionVersionUpdate, { increment: 1 });
});
