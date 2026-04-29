import test from "node:test";
import assert from "node:assert/strict";

import { AuthorizationError } from "@/domain/common/errors";
import {
  assertCanAccessProject,
  assertCanAccessTask,
  assertCanAccessWorkspace,
  assertCanManageUsers,
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
