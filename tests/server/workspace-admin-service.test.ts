import test from "node:test";
import assert from "node:assert/strict";

import { AuthorizationError, ValidationError } from "@/domain/common/errors";
import { WorkspaceAdminService } from "@/server/services/workspace-admin-service";

function buildContext(overrides: Record<string, unknown> = {}) {
  return {
    workspaceId: 1,
    actorUserId: 7,
    workspaceRole: "owner",
    appRole: "user",
    workspaces: [
      {
        id: 1,
        name: "Work",
        slug: "work",
        role: "owner",
      },
      {
        id: 2,
        name: "Personal",
        slug: "personal",
        role: "member",
      },
    ],
    accessibleWorkspaceIds: [1, 2],
    accessibleProjectIds: [],
    timezone: "UTC",
    ...overrides,
  };
}

function buildWorkspace(overrides: Record<string, unknown> = {}) {
  const createdAt = new Date("2026-04-01T00:00:00.000Z");
  return {
    id: 1,
    ownerUserId: 7,
    name: "Work",
    description: "Work space",
    slug: "work",
    createdAt,
    updatedAt: createdAt,
    owner: {
      id: 7,
      name: "Taskewr",
      email: "admin@taskewr.com",
      deactivatedAt: null,
    },
    memberships: [
      {
        id: 1,
        workspaceId: 1,
        userId: 7,
        role: "owner",
        createdAt,
        updatedAt: createdAt,
        user: {
          id: 7,
          name: "Taskewr",
          email: "admin@taskewr.com",
          deactivatedAt: null,
        },
      },
    ],
    _count: {
      projects: 0,
      cycles: 0,
      labels: 0,
      repeatRules: 0,
    },
    ...overrides,
  };
}

function buildService(repository: Record<string, unknown>, context = buildContext()) {
  return new WorkspaceAdminService(repository as never, {
    getAppContext: async () => context,
  } as never);
}

test("workspace members list only their visible workspaces", async () => {
  const listInput: Record<string, unknown>[] = [];
  const service = buildService(
    {
      listWorkspaces: async (input: Record<string, unknown>) => {
        listInput.push(input);
        return [buildWorkspace({ id: 2 })];
      },
    },
    buildContext({
      appRole: "user",
      workspaces: [{ id: 2, name: "Personal", slug: "personal", role: "member" }],
      accessibleWorkspaceIds: [2],
    }),
  );

  const workspaces = await service.listWorkspaces();

  assert.equal(workspaces.length, 1);
  assert.deepEqual(listInput[0].visibleWorkspaceIds, [2]);
  assert.equal(listInput[0].isAppAdmin, false);
  assert.equal(workspaces[0].actorCanManage, false);
});

test("app admins can list all workspaces without membership", async () => {
  const listInput: Record<string, unknown>[] = [];
  const service = buildService(
    {
      listWorkspaces: async (input: Record<string, unknown>) => {
        listInput.push(input);
        return [buildWorkspace()];
      },
    },
    buildContext({ appRole: "admin", workspaces: [] }),
  );

  const workspaces = await service.listWorkspaces();

  assert.equal(workspaces.length, 1);
  assert.equal(listInput[0].isAppAdmin, true);
});

test("getMemberDetails returns app-wide access details for app admins", async () => {
  const detailInputs: Record<string, unknown>[] = [];
  const service = buildService(
    {
      findById: async () => buildWorkspace({ id: 3, name: "Team" }),
      findMembership: async () => ({
        role: "owner",
        user: { name: "Member", deactivatedAt: null },
      }),
      findMemberAccessDetails: async (input: Record<string, unknown>) => {
        detailInputs.push(input);
        return {
          id: 12,
          name: "Member",
          email: "member@taskewr.com",
          timezone: "Europe/Bucharest",
          appRole: "user",
          deactivatedAt: null,
          memberships: [
            {
              workspaceId: 3,
              role: "owner",
              createdAt: new Date("2026-04-01T00:00:00.000Z"),
              workspace: { id: 3, name: "Team", slug: "team" },
            },
            {
              workspaceId: 4,
              role: "member",
              createdAt: new Date("2026-04-02T00:00:00.000Z"),
              workspace: { id: 4, name: "Personal", slug: "personal" },
            },
          ],
          projectMemberships: [
            {
              projectId: 44,
              role: "owner",
              createdAt: new Date("2026-04-03T00:00:00.000Z"),
              project: {
                id: 44,
                name: "Private Project",
                workspaceId: 4,
                workspace: { name: "Personal", slug: "personal" },
              },
            },
          ],
        };
      },
    },
    buildContext({ appRole: "admin", workspaces: [] }),
  );

  const details = await service.getMemberDetails(3, 12);

  assert.equal(detailInputs[0].isAppAdmin, true);
  assert.equal(details.overviewScope, "all");
  assert.equal(details.currentWorkspace.name, "Team");
  assert.equal(details.currentWorkspace.role, "owner");
  assert.equal(details.workspaces.length, 2);
  assert.equal(details.projects[0].name, "Private Project");
});

test("getMemberDetails limits non-app-admin overview to manageable workspaces", async () => {
  const detailInputs: Record<string, unknown>[] = [];
  const service = buildService({
    findById: async () => buildWorkspace({ id: 1, name: "Work" }),
    findMembership: async () => ({
      role: "member",
      user: { name: "Member", deactivatedAt: null },
    }),
    findMemberAccessDetails: async (input: Record<string, unknown>) => {
      detailInputs.push(input);
      return {
        id: 12,
        name: "Member",
        email: "member@taskewr.com",
        timezone: null,
        appRole: "user",
        deactivatedAt: null,
        memberships: [
          {
            workspaceId: 1,
            role: "member",
            createdAt: new Date("2026-04-01T00:00:00.000Z"),
            workspace: { id: 1, name: "Work", slug: "work" },
          },
        ],
        projectMemberships: [],
      };
    },
  });

  const details = await service.getMemberDetails(1, 12);

  assert.equal(detailInputs[0].isAppAdmin, false);
  assert.deepEqual(detailInputs[0].visibleWorkspaceIds, [1]);
  assert.equal(details.overviewScope, "managed");
  assert.equal(details.currentWorkspace.role, "member");
});

test("workspace members cannot edit workspace settings", async () => {
  const service = buildService(
    {
      findById: async () => buildWorkspace({ id: 2 }),
    },
    buildContext({
      appRole: "user",
      workspaces: [{ id: 2, name: "Personal", slug: "personal", role: "member" }],
    }),
  );

  await assert.rejects(
    () => service.updateWorkspace(2, { name: "Personal", description: "" }),
    (error) => error instanceof AuthorizationError && error.code === "workspace_management_denied",
  );
});

test("createWorkspace creates an owner workspace with a unique slug", async () => {
  const createdData: Record<string, unknown>[] = [];
  const service = buildService({
    slugExists: async (slug: string) => slug === "team",
    findActiveUserById: async (id: number) => ({
      id,
      name: "Taskewr",
      email: "admin@taskewr.com",
      deactivatedAt: null,
    }),
    createWithOwner: async (data: Record<string, unknown>) => {
      createdData.push(data);
      return buildWorkspace({
        id: 3,
        name: data.name,
        description: data.description,
        slug: data.slug,
        ownerUserId: data.ownerUserId,
      });
    },
  });

  const workspace = await service.createWorkspace({
    name: "Team",
    description: "Shared team work",
  });

  assert.equal(workspace.name, "Team");
  assert.equal(createdData[0].ownerUserId, 7);
  assert.equal(createdData[0].slug, "team-2");
});

test("app admins can choose the owner when creating a workspace", async () => {
  const createdData: Record<string, unknown>[] = [];
  const service = buildService(
    {
      slugExists: async () => false,
      findActiveUserById: async (id: number) => ({
        id,
        name: "Selected Owner",
        email: "owner@taskewr.com",
        deactivatedAt: null,
      }),
      createWithOwner: async (data: Record<string, unknown>) => {
        createdData.push(data);
        return buildWorkspace({
          id: 4,
          name: data.name,
          description: data.description,
          slug: data.slug,
          ownerUserId: data.ownerUserId,
        });
      },
    },
    buildContext({ appRole: "admin", workspaces: [] }),
  );

  const workspace = await service.createWorkspace({
    name: "Client",
    description: "",
    ownerUserId: 12,
  });

  assert.equal(workspace.name, "Client");
  assert.equal(createdData[0].ownerUserId, 12);
});

test("plain workspace members can create their own workspace", async () => {
  const createdData: Record<string, unknown>[] = [];
  const service = buildService(
    {
      slugExists: async () => false,
      findActiveUserById: async (id: number) => ({
        id,
        name: "Member",
        email: "member@taskewr.com",
        deactivatedAt: null,
      }),
      createWithOwner: async (data: Record<string, unknown>) => {
        createdData.push(data);
        return buildWorkspace({
          id: 5,
          name: data.name,
          description: data.description,
          slug: data.slug,
          ownerUserId: data.ownerUserId,
        });
      },
    },
    buildContext({
      actorUserId: 12,
      workspaces: [{ id: 2, name: "Personal", slug: "personal", role: "member" }],
      accessibleWorkspaceIds: [2],
    }),
  );

  await service.createWorkspace({
    name: "Side Project",
    description: "",
    ownerUserId: 7,
  });

  assert.equal(createdData[0].ownerUserId, 12);
});

test("workspace owner selection requires an active user", async () => {
  const service = buildService(
    {
      slugExists: async () => false,
      findActiveUserById: async () => ({
        id: 12,
        name: "Inactive",
        email: "inactive@taskewr.com",
        deactivatedAt: new Date("2026-04-01T00:00:00.000Z"),
      }),
    },
    buildContext({ appRole: "admin", workspaces: [] }),
  );

  await assert.rejects(
    () =>
      service.createWorkspace({
        name: "Client",
        description: "",
        ownerUserId: 12,
      }),
    (error) => error instanceof ValidationError && error.code === "workspace_owner_invalid",
  );
});

test("addMember adds an active existing user", async () => {
  const addedMembers: Record<string, unknown>[] = [];
  const service = buildService({
    findById: async () => buildWorkspace(),
    findActiveUserById: async () => ({
      id: 12,
      name: "Member",
      email: "member@taskewr.com",
      deactivatedAt: null,
    }),
    findMembership: async () => null,
    addMember: async (workspaceId: number, userId: number, role: string) => {
      addedMembers.push({ workspaceId, userId, role });
    },
  });

  await service.addMember(1, { userId: 12, role: "member" });

  assert.deepEqual(addedMembers[0], { workspaceId: 1, userId: 12, role: "member" });
});

test("workspace admins cannot add owners", async () => {
  const service = buildService(
    {
      findById: async () => buildWorkspace(),
    },
    buildContext({
      workspaces: [{ id: 1, name: "Work", slug: "work", role: "admin" }],
    }),
  );

  await assert.rejects(
    () => service.addMember(1, { userId: 12, role: "owner" }),
    (error) =>
      error instanceof AuthorizationError && error.code === "workspace_owner_management_denied",
  );
});

test("addMember rejects inactive users", async () => {
  const service = buildService({
    findById: async () => buildWorkspace(),
    findActiveUserById: async () => ({
      id: 12,
      name: "Inactive",
      email: "inactive@taskewr.com",
      deactivatedAt: new Date("2026-04-01T00:00:00.000Z"),
    }),
  });

  await assert.rejects(
    () => service.addMember(1, { userId: 12, role: "member" }),
    (error) => error instanceof ValidationError && error.code === "workspace_member_inactive",
  );
});

test("addMember rejects duplicate memberships", async () => {
  const service = buildService({
    findById: async () => buildWorkspace(),
    findActiveUserById: async () => ({
      id: 12,
      name: "Member",
      email: "member@taskewr.com",
      deactivatedAt: null,
    }),
    findMembership: async () => ({
      role: "member",
      user: { deactivatedAt: null },
    }),
  });

  await assert.rejects(
    () => service.addMember(1, { userId: 12, role: "member" }),
    (error) => error instanceof ValidationError && error.code === "workspace_member_exists",
  );
});

test("createAndAddMember creates a normal user with personal workspace and workspace membership", async () => {
  const createdUsers: Record<string, unknown>[] = [];
  const service = buildService({
    findById: async () => buildWorkspace(),
    findUserByEmail: async () => null,
    slugExists: async (slug: string) => slug === "new-user",
    createUserWithPersonalWorkspaceAndWorkspaceMembership: async (data: Record<string, unknown>) => {
      createdUsers.push(data);
      return {
        id: 12,
        name: "New User",
        email: "new@taskewr.com",
        deactivatedAt: null,
      };
    },
  });

  await service.createAndAddMember(1, {
    name: "New User",
    email: "New@Taskewr.com",
    password: "taskewr",
    timezone: "Europe/Bucharest",
    role: "admin",
  });

  assert.equal((createdUsers[0].user as Record<string, unknown>).email, "new@taskewr.com");
  assert.equal((createdUsers[0].user as Record<string, unknown>).appRole, "user");
  assert.equal((createdUsers[0].personalWorkspace as Record<string, unknown>).slug, "new-user-2");
  assert.deepEqual(createdUsers[0].workspaceMembership, { workspaceId: 1, role: "admin" });
});

test("createAndAddMember rejects duplicate emails", async () => {
  const service = buildService({
    findById: async () => buildWorkspace(),
    findUserByEmail: async () => ({
      id: 12,
      name: "Existing",
      email: "existing@taskewr.com",
      deactivatedAt: null,
    }),
  });

  await assert.rejects(
    () =>
      service.createAndAddMember(1, {
        name: "Existing",
        email: "existing@taskewr.com",
        password: "taskewr",
        timezone: "Europe/Bucharest",
        role: "member",
      }),
    (error) => error instanceof ValidationError && error.code === "user_email_taken",
  );
});

test("workspace admins cannot create and add owners", async () => {
  const service = buildService(
    {
      findById: async () => buildWorkspace(),
    },
    buildContext({
      workspaces: [{ id: 1, name: "Work", slug: "work", role: "admin" }],
    }),
  );

  await assert.rejects(
    () =>
      service.createAndAddMember(1, {
        name: "Owner",
        email: "owner@taskewr.com",
        password: "taskewr",
        timezone: "Europe/Bucharest",
        role: "owner",
      }),
    (error) =>
      error instanceof AuthorizationError && error.code === "workspace_owner_management_denied",
  );
});

test("updateMember changes a non-owner member role", async () => {
  const updatedRoles: Record<string, unknown>[] = [];
  const service = buildService({
    findById: async () => buildWorkspace(),
    findMembership: async () => ({
      role: "member",
      user: { deactivatedAt: null },
    }),
    updateMemberRole: async (workspaceId: number, userId: number, role: string) => {
      updatedRoles.push({ workspaceId, userId, role });
    },
  });

  await service.updateMember(1, 12, { role: "admin" });

  assert.deepEqual(updatedRoles[0], { workspaceId: 1, userId: 12, role: "admin" });
});

test("workspace admins cannot promote members to owner", async () => {
  const service = buildService(
    {
      findById: async () => buildWorkspace(),
      findMembership: async () => ({
        role: "member",
        user: { deactivatedAt: null },
      }),
    },
    buildContext({
      workspaces: [{ id: 1, name: "Work", slug: "work", role: "admin" }],
    }),
  );

  await assert.rejects(
    () => service.updateMember(1, 12, { role: "owner" }),
    (error) =>
      error instanceof AuthorizationError && error.code === "workspace_owner_management_denied",
  );
});

test("workspace admins cannot demote owners", async () => {
  const service = buildService(
    {
      findById: async () => buildWorkspace(),
      findMembership: async () => ({
        role: "owner",
        user: { deactivatedAt: null },
      }),
      countActiveOwners: async () => 2,
    },
    buildContext({
      workspaces: [{ id: 1, name: "Work", slug: "work", role: "admin" }],
    }),
  );

  await assert.rejects(
    () => service.updateMember(1, 7, { role: "admin" }),
    (error) =>
      error instanceof AuthorizationError && error.code === "workspace_owner_management_denied",
  );
});

test("demoting the last active workspace owner is rejected", async () => {
  const service = buildService({
    findById: async () => buildWorkspace(),
    findMembership: async () => ({
      role: "owner",
      user: { deactivatedAt: null },
    }),
    countActiveOwners: async () => 1,
  });

  await assert.rejects(
    () => service.updateMember(1, 7, { role: "admin" }),
    (error) => error instanceof ValidationError && error.code === "workspace_last_owner",
  );
});

test("removing a member with project access in the workspace is rejected", async () => {
  const service = buildService({
    findById: async () => buildWorkspace(),
    findMembership: async () => ({
      role: "member",
      user: { deactivatedAt: null },
    }),
    countUserProjectMembershipsInWorkspace: async () => 1,
  });

  await assert.rejects(
    () => service.removeMember(1, 12),
    (error) => error instanceof ValidationError && error.code === "workspace_member_has_projects",
  );
});

test("workspace admins cannot remove owners", async () => {
  const service = buildService(
    {
      findById: async () => buildWorkspace(),
      findMembership: async () => ({
        role: "owner",
        user: { deactivatedAt: null },
      }),
      countActiveOwners: async () => 2,
    },
    buildContext({
      workspaces: [{ id: 1, name: "Work", slug: "work", role: "admin" }],
    }),
  );

  await assert.rejects(
    () => service.removeMember(1, 7),
    (error) =>
      error instanceof AuthorizationError && error.code === "workspace_owner_management_denied",
  );
});

test("removing the last workspace membership for a user is rejected", async () => {
  const service = buildService({
    findById: async () => buildWorkspace(),
    findMembership: async () => ({
      role: "member",
      user: { deactivatedAt: null },
    }),
    countUserProjectMembershipsInWorkspace: async () => 0,
    countUserWorkspaceMemberships: async () => 1,
  });

  await assert.rejects(
    () => service.removeMember(1, 12),
    (error) => error instanceof ValidationError && error.code === "workspace_member_last_workspace",
  );
});

test("deleting a non-empty workspace is rejected", async () => {
  const service = buildService({
    findById: async () =>
      buildWorkspace({
        _count: {
          projects: 1,
          cycles: 0,
          labels: 0,
          repeatRules: 0,
        },
      }),
  });

  await assert.rejects(
    () => service.deleteWorkspace(1),
    (error) => error instanceof ValidationError && error.code === "workspace_not_empty",
  );
});

test("workspace admins cannot delete empty workspaces", async () => {
  const service = buildService(
    {
      findById: async () => buildWorkspace(),
    },
    buildContext({
      workspaces: [{ id: 1, name: "Work", slug: "work", role: "admin" }],
    }),
  );

  await assert.rejects(
    () => service.deleteWorkspace(1),
    (error) => error instanceof AuthorizationError && error.code === "workspace_owner_management_denied",
  );
});

test("empty workspaces can be deleted", async () => {
  const deletedWorkspaces: number[] = [];
  const service = buildService({
    findById: async () => buildWorkspace(),
    findMembersWithOnlyThisWorkspace: async () => [],
    deleteEmptyWorkspace: async (workspaceId: number) => {
      deletedWorkspaces.push(workspaceId);
    },
  });

  const result = await service.deleteWorkspace(1);

  assert.deepEqual(result, { id: 1 });
  assert.deepEqual(deletedWorkspaces, [1]);
});

test("deleting a workspace cannot leave users with no workspace", async () => {
  const service = buildService({
    findById: async () => buildWorkspace(),
    findMembersWithOnlyThisWorkspace: async () => [
      {
        id: 7,
        name: "Taskewr",
        email: "admin@taskewr.com",
        _count: { memberships: 1 },
      },
    ],
  });

  await assert.rejects(
    () => service.deleteWorkspace(1),
    (error) =>
      error instanceof ValidationError && error.code === "workspace_user_last_membership",
  );
});
