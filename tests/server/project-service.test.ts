import assert from "node:assert/strict";
import test from "node:test";

import { AuthorizationError } from "@/domain/common/errors";
import { ProjectService } from "@/server/services/project-service";

const contextService = {
  getAppContext: async () => ({
    workspaceId: 1,
    actorUserId: 7,
    workspaceRole: "owner",
    timezone: "UTC",
  }),
};

function buildService(project: { workspaceId: number | null }) {
  return new ProjectService(
    {
      findById: async () => ({
        id: 10,
        name: "Project",
        description: null,
        workspaceId: project.workspaceId,
        sortOrder: 1,
        archivedAt: null,
        _count: {
          tasks: 0,
        },
      }),
    } as never,
    contextService as never,
  );
}

test("getProject rejects projects outside the actor workspace", async () => {
  await assert.rejects(
    () => buildService({ workspaceId: 99 }).getProject(10),
    (error) => error instanceof AuthorizationError && error.code === "workspace_access_denied",
  );
});

test("getProject rejects projects without workspace ownership", async () => {
  await assert.rejects(
    () => buildService({ workspaceId: null }).getProject(10),
    (error) => error instanceof AuthorizationError && error.code === "workspace_access_denied",
  );
});
