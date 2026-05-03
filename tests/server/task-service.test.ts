import assert from "node:assert/strict";
import test from "node:test";

import { AuthorizationError, NotFoundError, ValidationError } from "@/domain/common/errors";
import { TaskService } from "@/server/services/task-service";

const appContext = {
  workspaceId: 1,
  actorUserId: 7,
  workspaceRole: "owner",
  appRole: "admin",
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
    dueReminderTime: null,
    repeatRuleId: null,
    notificationSubscriptions: [],
    project: {
      workspaceId: 1,
    },
    childTasks: [],
    ...overrides,
  };
}

function buildTaskService(repository: Record<string, unknown>) {
  return new TaskService(repository as never, {} as never, contextService as never, {
    subscribeTaskCreator: async () => {},
    syncTaskDueReminder: async () => {},
  } as never);
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
  } as never, {
    subscribeTaskCreator: async () => {},
    syncTaskDueReminder: async () => {},
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
  } as never, {
    subscribeTaskCreator: async () => {},
    syncTaskDueReminder: async () => {},
  } as never);

  await assert.rejects(
    () => service.createTask(validTaskInput as never),
    (error) => error instanceof ValidationError && error.code === "task_project_archived",
  );
});

test("createTask auto-subscribes creator and syncs due reminder delivery", async () => {
  const notificationCalls: string[] = [];
  const service = new TaskService({
    findProjectById: async () => ({
      id: 2,
      workspaceId: 1,
      archivedAt: null,
    }),
    listTasksForHierarchy: async () => [],
    create: async () => buildTask({ id: 44, projectId: 2 }),
    replaceTaskLabels: async () => {},
    updateById: async () => buildTask({ id: 44, projectId: 2 }),
    findById: async () => buildTask({ id: 44, projectId: 2 }),
  } as never, {
    deactivateForSourceTask: async () => {},
  } as never, {
    getAppContext: async () => ({
      ...appContext,
      accessibleProjectIds: [1, 2],
    }),
  } as never, {
    subscribeTaskCreator: async (taskId: number, userId: number) => {
      notificationCalls.push(`subscribe:${taskId}:${userId}`);
    },
    syncTaskDueReminder: async (taskId: number) => {
      notificationCalls.push(`sync:${taskId}`);
    },
  } as never);

  await service.createTask({
    ...validTaskInput,
    projectId: 2,
    dueDate: "2026-05-01",
    dueReminderTime: "09:30",
  } as never);

  assert.deepEqual(notificationCalls, ["subscribe:44:7", "sync:44"]);
});

test("createTask stores no assignee by default", async () => {
  const createCalls: Array<Record<string, unknown>> = [];
  const service = new TaskService({
    findProjectById: async () => ({
      id: 2,
      workspaceId: 1,
      archivedAt: null,
    }),
    listTasksForHierarchy: async () => [],
    create: async (data: Record<string, unknown>) => {
      createCalls.push(data);
      return buildTask({ id: 44, projectId: 2 });
    },
    replaceTaskLabels: async () => {},
    updateById: async () => buildTask({ id: 44, projectId: 2 }),
    findById: async () => buildTask({ id: 44, projectId: 2 }),
  } as never, {
    deactivateForSourceTask: async () => {},
  } as never, {
    getAppContext: async () => ({
      ...appContext,
      accessibleProjectIds: [1, 2],
    }),
  } as never, {
    subscribeTaskCreator: async () => {},
    syncTaskDueReminder: async () => {},
  } as never);

  await service.createTask({
    ...validTaskInput,
    projectId: 2,
  } as never);

  assert.equal(createCalls[0].assigneeUserId, null);
});

test("createTask accepts assignees who are active project members", async () => {
  const createCalls: Array<Record<string, unknown>> = [];
  const service = new TaskService({
    findProjectById: async () => ({
      id: 2,
      workspaceId: 1,
      archivedAt: null,
    }),
    findActiveProjectMemberUser: async (projectId: number, userId: number) =>
      projectId === 2 && userId === 9 ? { userId: 9 } : null,
    listTasksForHierarchy: async () => [],
    create: async (data: Record<string, unknown>) => {
      createCalls.push(data);
      return buildTask({ id: 44, projectId: 2, assigneeUserId: 9 });
    },
    replaceTaskLabels: async () => {},
    updateById: async () => buildTask({ id: 44, projectId: 2, assigneeUserId: 9 }),
    findById: async () => buildTask({ id: 44, projectId: 2, assigneeUserId: 9 }),
  } as never, {
    deactivateForSourceTask: async () => {},
  } as never, {
    getAppContext: async () => ({
      ...appContext,
      accessibleProjectIds: [1, 2],
    }),
  } as never, {
    subscribeTaskCreator: async () => {},
    syncTaskDueReminder: async () => {},
  } as never);

  await service.createTask({
    ...validTaskInput,
    projectId: 2,
    assigneeUserId: 9,
  } as never);

  assert.equal(createCalls[0].assigneeUserId, 9);
});

test("createTask rejects assignees who are not active project members", async () => {
  const service = new TaskService({
    findProjectById: async () => ({
      id: 2,
      workspaceId: 1,
      archivedAt: null,
    }),
    findActiveProjectMemberUser: async () => null,
  } as never, {} as never, {
    getAppContext: async () => ({
      ...appContext,
      accessibleProjectIds: [1, 2],
    }),
  } as never, {
    subscribeTaskCreator: async () => {},
    syncTaskDueReminder: async () => {},
  } as never);

  await assert.rejects(
    () =>
      service.createTask({
        ...validTaskInput,
        projectId: 2,
        assigneeUserId: 99,
      } as never),
    (error) => error instanceof ValidationError && error.code === "task_assignee_invalid",
  );
});

test("updateTask can change and clear assignees", async () => {
  const updateCalls: Array<Record<string, unknown>> = [];
  const service = new TaskService({
    findProjectById: async () => ({
      id: 2,
      workspaceId: 1,
      archivedAt: null,
    }),
    findActiveProjectMemberUser: async (_projectId: number, userId: number) =>
      userId === 9 ? { userId: 9 } : null,
    findById: async () => buildTask({ id: 44, projectId: 2 }),
    listTasksForHierarchy: async () => [],
    updateById: async (_id: number, data: Record<string, unknown>) => {
      updateCalls.push(data);
      return buildTask({ id: 44, projectId: 2 });
    },
    replaceTaskLabels: async () => {},
  } as never, {
    deactivateForSourceTask: async () => {},
  } as never, {
    getAppContext: async () => ({
      ...appContext,
      accessibleProjectIds: [1, 2],
    }),
  } as never, {
    subscribeTaskCreator: async () => {},
    syncTaskDueReminder: async () => {},
  } as never);

  await service.updateTask(44, {
    ...validTaskInput,
    projectId: 2,
    assigneeUserId: 9,
  } as never);
  await service.updateTask(44, {
    ...validTaskInput,
    projectId: 2,
    assigneeUserId: null,
  } as never);

  const assigneeUpdates = updateCalls.filter((call) => "assigneeUserId" in call);
  assert.equal(assigneeUpdates[0].assigneeUserId, 9);
  assert.equal(assigneeUpdates[1].assigneeUserId, null);
});

test("updateTask rejects reminder changes from unsubscribed editors", async () => {
  const service = new TaskService({
    findProjectById: async () => ({
      id: 2,
      workspaceId: 1,
      archivedAt: null,
    }),
    findById: async () => buildTask({ id: 44, projectId: 2 }),
    listTasksForHierarchy: async () => [],
  } as never, {
    deactivateForSourceTask: async () => {},
  } as never, {
    getAppContext: async () => ({
      ...appContext,
      accessibleProjectIds: [1, 2],
    }),
  } as never, {
    subscribeTaskCreator: async () => {},
    syncTaskDueReminder: async () => {},
  } as never);

  await assert.rejects(
    () =>
      service.updateTask(44, {
        ...validTaskInput,
        projectId: 2,
        dueDate: "2026-05-01",
        dueReminderTime: "09:30",
      } as never),
    (error) =>
      error instanceof AuthorizationError &&
      error.code === "task_reminder_subscription_required",
  );
});

test("updateTask allows subscribed editors to change reminders without auto-subscribing", async () => {
  const notificationCalls: string[] = [];
  const service = new TaskService({
    findProjectById: async () => ({
      id: 2,
      workspaceId: 1,
      archivedAt: null,
    }),
    findById: async () =>
      buildTask({
        id: 44,
        projectId: 2,
        notificationSubscriptions: [{ userId: 7 }],
      }),
    listTasksForHierarchy: async () => [],
    updateById: async () => buildTask({ id: 44, projectId: 2 }),
    replaceTaskLabels: async () => {},
  } as never, {
    deactivateForSourceTask: async () => {},
  } as never, {
    getAppContext: async () => ({
      ...appContext,
      accessibleProjectIds: [1, 2],
    }),
  } as never, {
    subscribeTaskCreator: async (taskId: number, userId: number) => {
      notificationCalls.push(`subscribe:${taskId}:${userId}`);
    },
    syncTaskDueReminder: async (taskId: number) => {
      notificationCalls.push(`sync:${taskId}`);
    },
  } as never);

  await service.updateTask(44, {
    ...validTaskInput,
    projectId: 2,
    dueDate: "2026-05-01",
    dueReminderTime: "09:30",
  } as never);

  assert.deepEqual(notificationCalls, ["sync:44"]);
});

test("updateTask allows unsubscribed editors to save unchanged reminder values", async () => {
  const notificationCalls: string[] = [];
  const service = new TaskService({
    findProjectById: async () => ({
      id: 2,
      workspaceId: 1,
      archivedAt: null,
    }),
    findById: async () =>
      buildTask({
        id: 44,
        projectId: 2,
        dueReminderTime: "09:30",
      }),
    listTasksForHierarchy: async () => [],
    updateById: async () => buildTask({ id: 44, projectId: 2 }),
    replaceTaskLabels: async () => {},
  } as never, {
    deactivateForSourceTask: async () => {},
  } as never, {
    getAppContext: async () => ({
      ...appContext,
      accessibleProjectIds: [1, 2],
    }),
  } as never, {
    subscribeTaskCreator: async (taskId: number, userId: number) => {
      notificationCalls.push(`subscribe:${taskId}:${userId}`);
    },
    syncTaskDueReminder: async (taskId: number) => {
      notificationCalls.push(`sync:${taskId}`);
    },
  } as never);

  await service.updateTask(44, {
    ...validTaskInput,
    projectId: 2,
    dueDate: "2026-05-01",
    dueReminderTime: "09:30",
  } as never);

  assert.deepEqual(notificationCalls, ["sync:44"]);
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

test("createTaskLink persists links for accessible tasks", async () => {
  const createCalls: Array<Record<string, unknown>> = [];
  const service = buildTaskService({
    findById: async () => buildTask(),
    createTaskLink: async (data: Record<string, unknown>) => {
      createCalls.push(data);
      return data;
    },
  });

  await service.createTaskLink(10, {
    title: "Spec",
    url: "https://example.com/spec",
  });

  assert.deepEqual(createCalls[0], {
    taskId: 10,
    createdByUserId: 7,
    title: "Spec",
    url: "https://example.com/spec",
  });
});

test("createTaskLink requires task access", async () => {
  const service = buildTaskService({
    findById: async () => buildTask({
      projectId: 99,
      project: {
        workspaceId: 1,
      },
    }),
  });

  await assert.rejects(
    () => service.createTaskLink(10, {
      title: "Spec",
      url: "https://example.com/spec",
    }),
    (error) => error instanceof AuthorizationError && error.code === "project_access_denied",
  );
});

test("deleteTaskLink rejects cross-task links", async () => {
  const service = buildTaskService({
    findById: async () => buildTask(),
    findTaskLink: async () => null,
  });

  await assert.rejects(
    () => service.deleteTaskLink(10, 88),
    (error) => error instanceof NotFoundError && error.code === "task_link_not_found",
  );
});

test("createTaskTimeEntry lets members log their own time", async () => {
  const createCalls: Array<Record<string, unknown>> = [];
  const service = buildTaskService({
    findById: async () => buildTask(),
    findProjectMemberUser: async (_projectId: number, userId: number) => ({
      userId,
      role: userId === 7 ? "member" : "owner",
      user: { deactivatedAt: null },
    }),
    createTaskTimeEntry: async (data: Record<string, unknown>) => {
      createCalls.push(data);
      return data;
    },
  });

  await service.createTaskTimeEntry(10, {
    hours: 1,
    minutes: 15,
  });

  assert.deepEqual(createCalls[0], {
    taskId: 10,
    userId: 7,
    createdByUserId: 7,
    minutes: 75,
  });
});

test("createTaskTimeEntry lets project admins log time for another active project member", async () => {
  const createCalls: Array<Record<string, unknown>> = [];
  const service = buildTaskService({
    findById: async () => buildTask(),
    findProjectMemberUser: async (_projectId: number, userId: number) => ({
      userId,
      role: userId === 7 ? "admin" : "member",
      user: { deactivatedAt: null },
    }),
    createTaskTimeEntry: async (data: Record<string, unknown>) => {
      createCalls.push(data);
      return data;
    },
  });

  await service.createTaskTimeEntry(10, {
    hours: 2,
    minutes: 0,
    userId: 8,
  });

  assert.deepEqual(createCalls[0], {
    taskId: 10,
    userId: 8,
    createdByUserId: 7,
    minutes: 120,
  });
});

test("createTaskTimeEntry rejects members logging time for another user", async () => {
  const service = buildTaskService({
    findById: async () => buildTask(),
    findProjectMemberUser: async (_projectId: number, userId: number) => ({
      userId,
      role: "member",
      user: { deactivatedAt: null },
    }),
  });

  await assert.rejects(
    () => service.createTaskTimeEntry(10, {
      hours: 1,
      minutes: 0,
      userId: 8,
    }),
    (error) => error instanceof AuthorizationError && error.code === "task_time_entry_user_denied",
  );
});

test("createTaskTimeEntry rejects inactive or non-project target users", async () => {
  const service = buildTaskService({
    findById: async () => buildTask(),
    findProjectMemberUser: async (_projectId: number, userId: number) => {
      if (userId === 7) {
        return {
          userId,
          role: "owner",
          user: { deactivatedAt: null },
        };
      }

      return {
        userId,
        role: "member",
        user: { deactivatedAt: new Date("2026-05-01T00:00:00.000Z") },
      };
    },
  });

  await assert.rejects(
    () => service.createTaskTimeEntry(10, {
      hours: 1,
      minutes: 0,
      userId: 8,
    }),
    (error) => error instanceof ValidationError && error.code === "task_time_entry_user_invalid",
  );
});

test("deleteTaskTimeEntry lets entry owners delete their own entries", async () => {
  const deleted: number[] = [];
  const service = buildTaskService({
    findById: async () => buildTask(),
    findTaskTimeEntry: async () => ({ id: 22, taskId: 10, userId: 7 }),
    findProjectMemberUser: async (_projectId: number, userId: number) => ({
      userId,
      role: "member",
      user: { deactivatedAt: null },
    }),
    deleteTaskTimeEntry: async (_taskId: number, entryId: number) => {
      deleted.push(entryId);
      return { id: entryId };
    },
  });

  await service.deleteTaskTimeEntry(10, 22);

  assert.deepEqual(deleted, [22]);
});

test("deleteTaskTimeEntry lets project owners delete any project entry", async () => {
  const deleted: number[] = [];
  const service = buildTaskService({
    findById: async () => buildTask(),
    findTaskTimeEntry: async () => ({ id: 22, taskId: 10, userId: 8 }),
    findProjectMemberUser: async (_projectId: number, userId: number) => ({
      userId,
      role: "owner",
      user: { deactivatedAt: null },
    }),
    deleteTaskTimeEntry: async (_taskId: number, entryId: number) => {
      deleted.push(entryId);
      return { id: entryId };
    },
  });

  await service.deleteTaskTimeEntry(10, 22);

  assert.deepEqual(deleted, [22]);
});

test("deleteTaskTimeEntry rejects unrelated users and cross-task entries", async () => {
  const missingEntryService = buildTaskService({
    findById: async () => buildTask(),
    findTaskTimeEntry: async () => null,
  });

  await assert.rejects(
    () => missingEntryService.deleteTaskTimeEntry(10, 22),
    (error) => error instanceof NotFoundError && error.code === "task_time_entry_not_found",
  );

  const unrelatedUserService = buildTaskService({
    findById: async () => buildTask(),
    findTaskTimeEntry: async () => ({ id: 22, taskId: 10, userId: 8 }),
    findProjectMemberUser: async (_projectId: number, userId: number) => ({
      userId,
      role: "member",
      user: { deactivatedAt: null },
    }),
  });

  await assert.rejects(
    () => unrelatedUserService.deleteTaskTimeEntry(10, 22),
    (error) => error instanceof AuthorizationError && error.code === "task_time_entry_delete_denied",
  );
});

test("createTaskAttachment stores file metadata for accessible tasks", async () => {
  const createCalls: Array<Record<string, unknown>> = [];
  const storage = {
    maxBytes: 100,
    store: async () => ({
      originalFileName: "notes.txt",
      storageKey: "task-10/key.txt",
      mimeType: "text/plain",
      sizeBytes: 4,
    }),
    delete: async () => {},
    read: async () => Buffer.from("test"),
  };
  const service = new TaskService({
    findById: async () => buildTask(),
    createTaskAttachment: async (data: Record<string, unknown>) => {
      createCalls.push(data);
      return data;
    },
  } as never, {} as never, contextService as never, {
    subscribeTaskCreator: async () => {},
    syncTaskDueReminder: async () => {},
  } as never, storage as never);

  await service.createTaskAttachment(10, {
    name: "notes.txt",
    type: "text/plain",
    size: 4,
    arrayBuffer: async () => new TextEncoder().encode("test").buffer,
  });

  assert.deepEqual(createCalls[0], {
    taskId: 10,
    uploadedByUserId: 7,
    originalFileName: "notes.txt",
    storageKey: "task-10/key.txt",
    mimeType: "text/plain",
    sizeBytes: 4,
  });
});

test("getTaskAttachmentDownload rejects inaccessible attachment tasks", async () => {
  const service = buildTaskService({
    findById: async () => buildTask({
      projectId: 99,
      project: {
        workspaceId: 1,
      },
    }),
  });

  await assert.rejects(
    () => service.getTaskAttachmentDownload(10, 4),
    (error) => error instanceof AuthorizationError && error.code === "project_access_denied",
  );
});
