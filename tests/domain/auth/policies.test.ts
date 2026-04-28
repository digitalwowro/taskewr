import test from "node:test";
import assert from "node:assert/strict";

import { AuthorizationError } from "@/domain/common/errors";
import {
  assertCanAccessProject,
  assertCanAccessTask,
  assertCanAccessWorkspace,
} from "@/domain/auth/policies";
import type { AuthenticatedActor } from "@/types/auth";

function buildActor(overrides: Partial<AuthenticatedActor> = {}): AuthenticatedActor {
  return {
    userId: 7,
    workspaceId: 3,
    workspaceRole: "member",
    timezone: "UTC",
    ...overrides,
  };
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

test("project and task policies are currently workspace-scoped", () => {
  const actor = buildActor({
    workspaceRole: "viewer",
  });

  assert.doesNotThrow(() => assertCanAccessProject(actor, { workspaceId: 3 }));
  assert.doesNotThrow(() => assertCanAccessTask(actor, { workspaceId: 3 }));
  assert.throws(() => assertCanAccessProject(actor, { workspaceId: 4 }), AuthorizationError);
  assert.throws(() => assertCanAccessTask(actor, { workspaceId: 4 }), AuthorizationError);
});
