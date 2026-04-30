import test from "node:test";
import assert from "node:assert/strict";

import { AuthorizationError } from "@/domain/common/errors";
import {
  assertCanAccessProject,
  assertCanAccessTask,
  assertCanAccessWorkspace,
  assertCanDeleteWorkspace,
  assertCanListWorkspaceAdmin,
  assertCanManageWorkspace,
  assertCanManageWorkspaceOwners,
  assertCanManageUsers,
  assertCanViewWorkspaceAdmin,
  requireWorkspaceOwnership,
} from "@/domain/auth/policies";
import type { AuthenticatedActor } from "@/types/auth";

function buildActor(overrides: Partial<AuthenticatedActor> = {}): AuthenticatedActor {
  const actor: AuthenticatedActor = {
    userId: 7,
    workspaceId: 3,
    workspaceRole: "member",
    appRole: "user",
    workspaceMemberships: [
      {
        workspaceId: 3,
        workspaceName: "Work",
        workspaceSlug: "work",
        role: "member",
      },
    ],
    accessibleWorkspaceIds: [3],
    timezone: "UTC",
  };

  return { ...actor, ...overrides };
}

test("workspace policy allows access inside the actor workspace", () => {
  assert.doesNotThrow(() => assertCanAccessWorkspace(buildActor(), 3));
});

test("workspace policy denies access outside the actor workspace", () => {
  assert.throws(
    () => assertCanAccessWorkspace(buildActor(), 4),
    (error) => error instanceof AuthorizationError && error.code === "workspace_access_denied",
  );
});

test("project and task policies require explicit project access", () => {
  const actor = {
    ...buildActor({ workspaceRole: "viewer" }),
    accessibleProjectIds: [10],
  };

  assert.doesNotThrow(() => assertCanAccessProject(actor, { projectId: 10 }));
  assert.doesNotThrow(() => assertCanAccessTask(actor, { projectId: 10 }));
  assert.throws(() => assertCanAccessProject(actor, { projectId: 11 }), AuthorizationError);
  assert.throws(() => assertCanAccessTask(actor, { projectId: 11 }), AuthorizationError);
});

test("user management policy requires app admin role", () => {
  assert.doesNotThrow(() => assertCanManageUsers(buildActor({ appRole: "admin" })));
  assert.throws(
    () => assertCanManageUsers(buildActor({ appRole: "user" })),
    (error) => error instanceof AuthorizationError && error.code === "user_management_denied",
  );
});

test("workspace management policy allows app admins and workspace owners or admins", () => {
  assert.doesNotThrow(() => assertCanManageWorkspace(buildActor({ appRole: "admin" }), 8));
  assert.doesNotThrow(() =>
    assertCanManageWorkspace(
      buildActor({
        workspaceMemberships: [
          {
            workspaceId: 8,
            workspaceName: "Team",
            workspaceSlug: "team",
            role: "owner",
          },
        ],
      }),
      8,
    ),
  );
  assert.doesNotThrow(() =>
    assertCanManageWorkspace(
      buildActor({
        workspaceMemberships: [
          {
            workspaceId: 8,
            workspaceName: "Team",
            workspaceSlug: "team",
            role: "admin",
          },
        ],
      }),
      8,
    ),
  );
});

test("workspace management policy rejects plain members", () => {
  assert.throws(
    () =>
      assertCanManageWorkspace(
        buildActor({
          workspaceMemberships: [
            {
              workspaceId: 8,
              workspaceName: "Team",
              workspaceSlug: "team",
              role: "member",
            },
          ],
        }),
        8,
      ),
    (error) => error instanceof AuthorizationError && error.code === "workspace_management_denied",
  );
});

test("workspace owner management policy rejects workspace admins", () => {
  assert.doesNotThrow(() =>
    assertCanManageWorkspaceOwners(
      buildActor({
        workspaceMemberships: [
          {
            workspaceId: 8,
            workspaceName: "Team",
            workspaceSlug: "team",
            role: "owner",
          },
        ],
      }),
      8,
    ),
  );
  assert.doesNotThrow(() => assertCanManageWorkspaceOwners(buildActor({ appRole: "admin" }), 8));
  assert.throws(
    () =>
      assertCanManageWorkspaceOwners(
        buildActor({
          workspaceMemberships: [
            {
              workspaceId: 8,
              workspaceName: "Team",
              workspaceSlug: "team",
              role: "admin",
            },
          ],
        }),
        8,
      ),
    (error) =>
      error instanceof AuthorizationError && error.code === "workspace_owner_management_denied",
  );
});

test("workspace delete policy requires app admin or workspace owner", () => {
  assert.doesNotThrow(() => assertCanDeleteWorkspace(buildActor({ appRole: "admin" }), 8));
  assert.doesNotThrow(() =>
    assertCanDeleteWorkspace(
      buildActor({
        workspaceMemberships: [
          {
            workspaceId: 8,
            workspaceName: "Team",
            workspaceSlug: "team",
            role: "owner",
          },
        ],
      }),
      8,
    ),
  );
  assert.throws(
    () =>
      assertCanDeleteWorkspace(
        buildActor({
          workspaceMemberships: [
            {
              workspaceId: 8,
              workspaceName: "Team",
              workspaceSlug: "team",
              role: "admin",
            },
          ],
        }),
        8,
      ),
    (error) => error instanceof AuthorizationError && error.code === "workspace_delete_denied",
  );
});

test("workspace admin listing includes any workspace member", () => {
  assert.doesNotThrow(() => assertCanListWorkspaceAdmin(buildActor({ appRole: "admin" })));
  assert.doesNotThrow(() =>
    assertCanListWorkspaceAdmin(
      buildActor({
        workspaceMemberships: [
          {
            workspaceId: 8,
            workspaceName: "Team",
            workspaceSlug: "team",
            role: "admin",
          },
        ],
      }),
    ),
  );
  assert.doesNotThrow(() => assertCanListWorkspaceAdmin(buildActor()));
  assert.throws(
    () => assertCanListWorkspaceAdmin(buildActor({ workspaceMemberships: [] })),
    (error) => error instanceof AuthorizationError && error.code === "workspace_management_denied",
  );
});

test("workspace admin view policy allows members only for their own workspaces", () => {
  assert.doesNotThrow(() => assertCanViewWorkspaceAdmin(buildActor(), 3));
  assert.throws(
    () => assertCanViewWorkspaceAdmin(buildActor(), 4),
    (error) => error instanceof AuthorizationError && error.code === "workspace_access_denied",
  );
});

test("workspace ownership helper rejects records without a workspace", () => {
  assert.equal(requireWorkspaceOwnership(3), 3);
  assert.throws(
    () => requireWorkspaceOwnership(null),
    (error) => error instanceof AuthorizationError && error.code === "workspace_access_denied",
  );
  assert.throws(
    () => requireWorkspaceOwnership(undefined),
    (error) => error instanceof AuthorizationError && error.code === "workspace_access_denied",
  );
});
