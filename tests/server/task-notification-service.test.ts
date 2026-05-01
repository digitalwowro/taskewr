import assert from "node:assert/strict";
import test from "node:test";

import {
  TASK_DUE_REMINDER_NOTIFICATION_KIND,
  TASK_NOTIFICATION_STATUS,
} from "@/data/prisma/repositories/task-notifications-repository";
import { TaskNotificationService } from "@/server/services/task-notification-service";

function buildContext() {
  return {
    workspaceId: 1,
    actorUserId: 7,
    workspaceRole: "owner",
    appRole: "admin",
    workspaces: [],
    accessibleWorkspaceIds: [1],
    accessibleProjectIds: [4],
    timezone: "Europe/Bucharest",
  };
}

function buildTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 12,
    projectId: 4,
    status: "todo",
    dueDate: new Date("2026-05-01T00:00:00.000Z"),
    dueReminderTime: "09:30",
    title: "Review rollout",
    project: {
      id: 4,
      name: "Service",
      archivedAt: null,
    },
    notificationSubscriptions: [
      {
        userId: 7,
        user: {
          id: 7,
          name: "R",
          email: "r@example.com",
          timezone: "Europe/Bucharest",
          deactivatedAt: null,
        },
      },
    ],
    ...overrides,
  };
}

test("syncTaskDueReminder creates current delivery for active subscribers", async () => {
  const created: Record<string, unknown>[] = [];
  let exceptUserIds: number[] = [];
  const service = new TaskNotificationService({
    findTaskForNotifications: async () => buildTask(),
    cancelOpenDueReminderDeliveriesExcept: async (_taskId: number, userIds: number[]) => {
      exceptUserIds = userIds;
    },
    findDeliveryByDedupeKey: async () => null,
    createDelivery: async (data: Record<string, unknown>) => {
      created.push(data);
    },
  } as never, {} as never, {} as never, async () => {});

  await service.syncTaskDueReminder(12);

  assert.deepEqual(exceptUserIds, [7]);
  assert.equal(created.length, 1);
  assert.equal(created[0].taskId, 12);
  assert.equal(created[0].userId, 7);
  assert.equal(created[0].kind, TASK_DUE_REMINDER_NOTIFICATION_KIND);
  assert.equal((created[0].scheduledAt as Date).toISOString(), "2026-05-01T06:30:00.000Z");
});

test("syncTaskDueReminder cancels open deliveries when reminder cannot send", async () => {
  let canceled = false;
  const service = new TaskNotificationService({
    findTaskForNotifications: async () => buildTask({ dueReminderTime: null }),
    cancelOpenDueReminderDeliveriesExcept: async () => {},
    cancelOpenDueReminderDeliveries: async () => {
      canceled = true;
    },
  } as never, {} as never, {} as never, async () => {});

  await service.syncTaskDueReminder(12);

  assert.equal(canceled, true);
});

test("subscribeCurrentUser subscribes accessible tasks and syncs delivery", async () => {
  let subscribed: { taskId: number; userId: number } | null = null;
  let syncedTaskId: number | null = null;
  const service = new TaskNotificationService({
    subscribe: async (taskId: number, userId: number) => {
      subscribed = { taskId, userId };
    },
    findTaskForNotifications: async () => buildTask(),
    cancelOpenDueReminderDeliveriesExcept: async () => {},
    findDeliveryByDedupeKey: async () => null,
    createDelivery: async () => {
      syncedTaskId = 12;
    },
  } as never, {
    findById: async () => buildTask(),
  } as never, {
    getAppContext: async () => buildContext(),
  } as never, async () => {});

  const result = await service.subscribeCurrentUser(12);

  assert.deepEqual(result, { subscribed: true });
  assert.deepEqual(subscribed, { taskId: 12, userId: 7 });
  assert.equal(syncedTaskId, 12);
});

test("processDueReminderBatch sends valid claimed deliveries", async () => {
  const scheduledAt = new Date("2026-05-01T06:30:00.000Z");
  let sentDeliveryId: number | null = null;
  let emailTo: string | null = null;
  const service = new TaskNotificationService({
    claimDueDeliveries: async () => [
      {
        id: 22,
        taskId: 12,
        userId: 7,
        attempts: 1,
        scheduledAt,
        task: buildTask({
          notificationSubscriptions: [{ userId: 7 }],
        }),
        user: {
          id: 7,
          name: "R",
          email: "r@example.com",
          timezone: "Europe/Bucharest",
          deactivatedAt: null,
        },
      },
    ],
    markDeliverySent: async (id: number) => {
      sentDeliveryId = id;
    },
  } as never, {} as never, {} as never, async (input) => {
    emailTo = input.to;
  });

  const result = await service.processDueReminderBatch({
    now: new Date("2026-05-01T06:31:00.000Z"),
    batchSize: 10,
    maxAttempts: 3,
    claimTimeoutMs: 60_000,
  });

  assert.equal(emailTo, "r@example.com");
  assert.equal(sentDeliveryId, 22);
  assert.deepEqual(result, { claimed: 1, sent: 1, canceled: 0, failed: 0 });
});

test("processDueReminderBatch cancels completed task deliveries", async () => {
  let canceledDeliveryId: number | null = null;
  const service = new TaskNotificationService({
    claimDueDeliveries: async () => [
      {
        id: 22,
        taskId: 12,
        userId: 7,
        attempts: 1,
        scheduledAt: new Date("2026-05-01T06:30:00.000Z"),
        task: buildTask({
          status: "done",
          notificationSubscriptions: [{ userId: 7 }],
        }),
        user: {
          id: 7,
          name: "R",
          email: "r@example.com",
          timezone: "Europe/Bucharest",
          deactivatedAt: null,
        },
      },
    ],
    markDeliveryCanceled: async (id: number) => {
      canceledDeliveryId = id;
    },
  } as never, {} as never, {} as never, async () => {
    throw new Error("Email should not be sent.");
  });

  const result = await service.processDueReminderBatch({
    now: new Date("2026-05-01T06:31:00.000Z"),
    batchSize: 10,
    maxAttempts: 3,
    claimTimeoutMs: 60_000,
  });

  assert.equal(canceledDeliveryId, 22);
  assert.deepEqual(result, { claimed: 1, sent: 0, canceled: 1, failed: 0 });
});

test("syncTaskDueReminder keeps sent delivery for same schedule", async () => {
  let updated = false;
  let created = false;
  const service = new TaskNotificationService({
    findTaskForNotifications: async () => buildTask(),
    cancelOpenDueReminderDeliveriesExcept: async () => {},
    findDeliveryByDedupeKey: async () => ({
      id: 30,
      scheduledAt: new Date("2026-05-01T06:30:00.000Z"),
      status: TASK_NOTIFICATION_STATUS.sent,
    }),
    createDelivery: async () => {
      created = true;
    },
    updateDelivery: async () => {
      updated = true;
    },
  } as never, {} as never, {} as never, async () => {});

  await service.syncTaskDueReminder(12);

  assert.equal(created, false);
  assert.equal(updated, false);
});
