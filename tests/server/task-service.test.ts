import assert from "node:assert/strict";
import test from "node:test";

import { AuthorizationError, ValidationError } from "@/domain/common/errors";
import { TaskService } from "@/server/services/task-service";

const appContext = {
  workspaceId: 1,
  actorUserId: 7,
  workspaceRole: "owner",
  workspaces: [
    {
      id: 1,
      name: "Work",
      slug: "work",
      role: "owner",
    },
  ],
  accessibleWorkspaceIds: [1],
  accessibleProjectIds: [1],
  timezone: "UTC",
};

const contextService = {
  getAppContext: async () => appContext,
};

function buildTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    projectId: 1,
    parentTaskId: null,
    status: "todo",
    repeatRuleId: null,
    project: {
      workspaceId: 1,
    },
    childTasks: [],
    ...overrides,
  };
}

function buildTaskService(repository: Record<string, unknown>) {
  return new TaskService(repository as never, {} as never, contextService as never);
}

const validTaskInput = {
  projectId: 2,
  title: "Move carefully",
  description: "",
  parentTaskId: null,
  status: "todo",
  priority: "medium",
  startDate: null,
  dueDate: null,
  labels: [],
  repeat: {
    enabled: false,
    scheduleType: "interval_days",
    interval: 1,
    weekdays: [],
    monthDay: null,
    specificDates: [],
    incompleteBehavior: "carry_forward",
  },
};

test("createTask rejects target projects without explicit membership", async () => {
  const service = buildTaskService({
    findProjectById: async () => ({
      id: 2,
      workspaceId: 1,
      archivedAt: null,
    }),
  });

  await assert.rejects(
    () => service.createTask(validTaskInput as never),
    (error) => error instanceof AuthorizationError && error.code === "project_access_denied",
  );
});

test("updateTask rejects moving a task into a project without explicit membership", async () => {
  const service = buildTaskService({
    findById: async () => buildTask(),
    findProjectById: async () => ({
      id: 2,
      workspaceId: 1,
      archivedAt: null,
    }),
  });

  await assert.rejects(
    () => service.updateTask(10, validTaskInput as never),
    (error) => error instanceof AuthorizationError && error.code === "project_access_denied",
  );
});

test("getTask rejects tasks without explicit project membership", async () => {
  const service = buildTaskService({
    findById: async () => buildTask({
      projectId: 99,
      project: {
        workspaceId: 1,
      },
    }),
  });

  await assert.rejects(
    () => service.getTask(10),
    (error) => error instanceof AuthorizationError && error.code === "project_access_denied",
  );
});

test("createTask rejects target projects without workspace ownership", async () => {
  const service = new TaskService({
    findProjectById: async () => ({
      id: 2,
      workspaceId: null,
      archivedAt: null,
    }),
  } as never, {} as never, {
    getAppContext: async () => ({
      ...appContext,
      accessibleProjectIds: [1, 2],
    }),
  } as never);

  await assert.rejects(
    () => service.createTask(validTaskInput as never),
    (error) => error instanceof AuthorizationError && error.code === "workspace_access_denied",
  );
});

test("createTask rejects archived target projects", async () => {
  const service = new TaskService({
    findProjectById: async () => ({
      id: 2,
      workspaceId: 1,
      archivedAt: new Date("2026-04-01T00:00:00.000Z"),
    }),
  } as never, {} as never, {
    getAppContext: async () => ({
      ...appContext,
      accessibleProjectIds: [1, 2],
    }),
  } as never);

  await assert.rejects(
    () => service.createTask(validTaskInput as never),
    (error) => error instanceof ValidationError && error.code === "task_project_archived",
  );
});

test("board moves reject lane task IDs from another project", async () => {
  const service = buildTaskService({
    findById: async () => buildTask(),
    listTasksByIds: async () => [
      { id: 10, projectId: 1, status: "todo" },
      { id: 99, projectId: 2, status: "todo" },
    ],
  });

  await assert.rejects(
    () =>
      service.planBoardMove({
        taskId: 10,
        projectId: 1,
        nextStatus: "todo",
        targetLaneTaskIds: [99, 10],
      }),
    (error) => error instanceof ValidationError && error.code === "task_board_cross_project",
  );
});

test("board moves reject lane task IDs from a different status", async () => {
  const service = buildTaskService({
    findById: async () => buildTask(),
    listTasksByIds: async () => [
      { id: 10, projectId: 1, status: "todo" },
      { id: 11, projectId: 1, status: "done" },
    ],
  });

  await assert.rejects(
    () =>
      service.planBoardMove({
        taskId: 10,
        projectId: 1,
        nextStatus: "todo",
        targetLaneTaskIds: [11, 10],
      }),
    (error) => error instanceof ValidationError && error.code === "task_board_invalid_lane_status",
  );
});

test("completeTask marks an accessible task done", async () => {
  let status = "todo";
  let updatedByUserId: number | null = null;
  const service = buildTaskService({
    findById: async () => buildTask({ status }),
    listTasksForHierarchy: async () => [
      { id: 10, projectId: 1, parentTaskId: null, status },
    ],
    updateById: async (_id: number, data: { status: string; updatedByUserId: number | null }) => {
      status = data.status;
      updatedByUserId = data.updatedByUserId;
      return buildTask({ status });
    },
  });

  const task = await service.completeTask(10);

  assert.equal(task.status, "done");
  assert.equal(updatedByUserId, 7);
});

test("completeTask rejects parent completion while descendants are active", async () => {
  const service = buildTaskService({
    findById: async () => buildTask(),
    listTasksForHierarchy: async () => [
      { id: 10, projectId: 1, parentTaskId: null, status: "todo" },
      { id: 11, projectId: 1, parentTaskId: 10, status: "in_progress" },
    ],
  });

  await assert.rejects(
    () => service.completeTask(10),
    (error) => error instanceof ValidationError && error.code === "task_descendants_incomplete",
  );
});

test("completeTask leaves already completed tasks unchanged", async () => {
  let updateCount = 0;
  const service = buildTaskService({
    findById: async () => buildTask({ status: "done" }),
    updateById: async () => {
      updateCount += 1;
      return buildTask({ status: "done" });
    },
  });

  const task = await service.completeTask(10);

  assert.equal(task.status, "done");
  assert.equal(updateCount, 0);
});

test("reopenTask marks a completed task todo", async () => {
  let status = "done";
  let updatedByUserId: number | null = null;
  const service = buildTaskService({
    findById: async () => buildTask({ status }),
    updateById: async (_id: number, data: { status: string; updatedByUserId: number | null }) => {
      status = data.status;
      updatedByUserId = data.updatedByUserId;
      return buildTask({ status });
    },
  });

  const task = await service.reopenTask(10);

  assert.equal(task.status, "todo");
  assert.equal(updatedByUserId, 7);
});

test("reopenTask leaves active tasks unchanged", async () => {
  let updateCount = 0;
  const service = buildTaskService({
    findById: async () => buildTask({ status: "in_progress" }),
    updateById: async () => {
      updateCount += 1;
      return buildTask({ status: "todo" });
    },
  });

  const task = await service.reopenTask(10);

  assert.equal(task.status, "in_progress");
  assert.equal(updateCount, 0);
});
