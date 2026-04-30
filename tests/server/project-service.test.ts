import assert from "node:assert/strict";
import test from "node:test";

import { AuthorizationError, ValidationError } from "@/domain/common/errors";
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

function projectRecord(id: number, sortOrder: number) {
  return {
    id,
    name: `Project ${id}`,
    description: null,
    workspaceId: 1,
    sortOrder,
    archivedAt: null,
    workspace: { name: "Work" },
    _count: {
      tasks: 0,
    },
  };
}

test("moveProject reorders by the active project list and renumbers the workspace", async () => {
  const updates: Array<{ id: number; sortOrder: number }> = [];
  const service = new ProjectService(
    {
      findById: async () => projectRecord(10, 10),
      listActiveProjectsForReorder: async () => [
        projectRecord(20, 5),
        projectRecord(10, 10),
        projectRecord(30, 10),
      ],
      updateProjectSortOrders: async (nextUpdates: Array<{ id: number; sortOrder: number }>) => {
        updates.push(...nextUpdates);
      },
    } as never,
    {
      getAppContext: async () => ({
        ...(await contextService.getAppContext()),
        accessibleWorkspaceIds: [1],
        accessibleProjectIds: [10, 20, 30],
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

  const project = await service.moveProject(10, { direction: "down" });

  assert.equal(project?.id, 10);
  assert.deepEqual(updates, [
    { id: 20, sortOrder: 1 },
    { id: 30, sortOrder: 2 },
    { id: 10, sortOrder: 3 },
  ]);
});

test("moveProject rejects moving past the active project list edge", async () => {
  const updates: Array<{ id: number; sortOrder: number }> = [];
  const service = new ProjectService(
    {
      findById: async () => projectRecord(10, 1),
      listActiveProjectsForReorder: async () => [projectRecord(10, 1), projectRecord(20, 2)],
      updateProjectSortOrders: async (nextUpdates: Array<{ id: number; sortOrder: number }>) => {
        updates.push(...nextUpdates);
      },
    } as never,
    {
      getAppContext: async () => ({
        ...(await contextService.getAppContext()),
        accessibleWorkspaceIds: [1],
        accessibleProjectIds: [10, 20],
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

  await assert.rejects(
    () => service.moveProject(10, { direction: "up" }),
    (error) =>
      error instanceof ValidationError && error.code === "project_move_target_missing",
  );
  assert.deepEqual(updates, []);
});
