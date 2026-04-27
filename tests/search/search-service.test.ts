import test from "node:test";
import assert from "node:assert/strict";

import { SearchService } from "@/server/services/search-service";

test("SearchService applies default task search filters", async () => {
  let capturedInput: unknown = null;

  const service = new SearchService({
    searchTasks(input: unknown) {
      capturedInput = input;
      return Promise.resolve([]);
    },
  } as never, {
    getAppContext() {
      return Promise.resolve({
        workspaceId: 3,
        actorUserId: 7,
      });
    },
  } as never);

  const result = await service.searchTasks({ query: "rollout" });

  assert.deepEqual(result, []);
  assert.deepEqual(capturedInput, {
    query: "rollout",
    sort: "priority",
    direction: "desc",
    status: ["todo", "in_progress"],
    priority: [],
    includeArchivedProjects: false,
    limit: 50,
    workspaceId: 3,
  });
});

test("SearchService preserves explicit all-status and priority filters", async () => {
  let capturedInput: unknown = null;

  const service = new SearchService({
    searchTasks(input: unknown) {
      capturedInput = input;
      return Promise.resolve([]);
    },
  } as never, {
    getAppContext() {
      return Promise.resolve({
        workspaceId: 3,
        actorUserId: 7,
      });
    },
  } as never);

  await service.searchTasks({
    query: "handoff",
    status: [],
    priority: ["urgent"],
    includeArchivedProjects: true,
    limit: 10,
  });

  assert.deepEqual(capturedInput, {
    query: "handoff",
    sort: "priority",
    direction: "desc",
    status: [],
    priority: ["urgent"],
    includeArchivedProjects: true,
    limit: 10,
    workspaceId: 3,
  });
});
