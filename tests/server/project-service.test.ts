import assert from "node:assert/strict";
import test from "node:test";

import { AuthorizationError } from "@/domain/common/errors";
import { ProjectService } from "@/server/services/project-service";

const contextService = {
  getAppContext: async () => ({
    workspaceId: 1,
    actorUserId: 7,
    workspaceRole: "owner",
    appRole: "admin",
    timezone: "UTC",
  }),
};

function buildService({
  project,
  accessibleProjectIds = [10],
}: {
  project: { workspaceId: number | null };
  accessibleProjectIds?: number[];
}) {
  return new ProjectService(
    {
      findById: async () => ({
        id: 10,
        name: "Project",
        description: null,
        workspaceId: project.workspaceId,
        sortOrder: 1,
        archivedAt: null,
        workspace: project.workspaceId ? { name: "Work" } : null,
        _count: {
          tasks: 0,
        },
      }),
    } as never,
    {
      getAppContext: async () => ({
        ...(await contextService.getAppContext()),
        accessibleWorkspaceIds: [1, 99],
        accessibleProjectIds,
        workspaces: [
          {
            id: 1,
            name: "Work",
            slug: "work",
            role: "owner",
          },
        ],
      }),
    } as never,
  );
}

test("getProject rejects projects without explicit project membership", async () => {
  await assert.rejects(
    () => buildService({ project: { workspaceId: 1 }, accessibleProjectIds: [] }).getProject(10),
    (error) => error instanceof AuthorizationError && error.code === "project_access_denied",
  );
});

test("getProject allows project members even when workspace alone is not the visibility boundary", async () => {
  const project = await buildService({
    project: { workspaceId: 99 },
    accessibleProjectIds: [10],
  }).getProject(10);

  assert.equal(project.id, 10);
});
