import assert from "node:assert/strict";
import test from "node:test";

import { RepeatTaskService } from "@/server/services/repeat-task-service";

const sourceTask = {
  id: 10,
  projectId: 1,
  createdByUserId: 1,
  updatedByUserId: 1,
  title: "Check backup",
  description: "Daily operational check",
  priority: "high",
  startDate: new Date("2026-04-01T00:00:00.000Z"),
  dueDate: new Date("2026-04-01T00:00:00.000Z"),
  createdAt: new Date("2026-04-01T00:00:00.000Z"),
  taskLabels: [],
};

function buildRule(incompleteBehavior: "carry_forward" | "create_separate") {
  return {
    id: 1,
    workspaceId: 1,
    projectId: 1,
    sourceTaskId: 10,
    isActive: true,
    scheduleType: "interval_days",
    interval: 1,
    weekdays: [],
    monthDay: null,
    specificDates: [],
    incompleteBehavior,
    nextDueDate: new Date("2026-04-01T00:00:00.000Z"),
    lastSyncedAt: null,
    createdAt: new Date("2026-04-01T00:00:00.000Z"),
    updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    sourceTask,
    tasks: [],
  };
}

function buildStore(rule: ReturnType<typeof buildRule>) {
  const tasks: Array<{
    id: number;
    repeatRuleId: number;
    repeatScheduledFor: Date;
    status: string;
    repeatCarryCount: number;
  }> = [];

  return {
    tasks,
    listDueRules: async (_workspaceId: number, throughDate: Date) =>
      rule.nextDueDate && rule.nextDueDate <= throughDate ? [rule] : [],
    updateRule: async (_id: number, data: { nextDueDate?: Date | string | null; lastSyncedAt?: Date }) => {
      if ("nextDueDate" in data) {
        rule.nextDueDate =
          typeof data.nextDueDate === "string"
            ? new Date(`${data.nextDueDate}T00:00:00.000Z`)
            : data.nextDueDate ?? null;
      }
      return rule;
    },
    findTaskForOccurrence: async (_repeatRuleId: number, scheduledFor: Date) =>
      tasks.find((task) => task.repeatScheduledFor.getTime() === scheduledFor.getTime()) ?? null,
    findOpenTaskForRule: async () => tasks.find((task) => task.status !== "done" && task.status !== "canceled") ?? null,
    createTask: async (data: { repeatRuleId: number; repeatScheduledFor: Date; status: string; repeatCarryCount?: number }) => {
      const task = {
        id: tasks.length + 100,
        repeatRuleId: data.repeatRuleId,
        repeatScheduledFor: data.repeatScheduledFor,
        status: data.status,
        repeatCarryCount: data.repeatCarryCount ?? 0,
      };
      tasks.push(task);
      return task;
    },
    updateTask: async (id: number, data: { repeatScheduledFor?: Date; repeatCarryCount?: { increment: number } }) => {
      const task = tasks.find((item) => item.id === id);

      if (!task) {
        throw new Error("Missing task");
      }

      if (data.repeatScheduledFor) {
        task.repeatScheduledFor = data.repeatScheduledFor;
      }

      if (data.repeatCarryCount) {
        task.repeatCarryCount += data.repeatCarryCount.increment;
      }

      return task;
    },
    replaceTaskLabels: async () => undefined,
  };
}

test("carry forward repeat rules reuse one open task", async () => {
  const store = buildStore(buildRule("carry_forward"));
  const service = new RepeatTaskService(store as never);

  await service.syncDueTasks(1, new Date("2026-04-03T12:00:00.000Z"));
  await service.syncDueTasks(1, new Date("2026-04-03T12:00:00.000Z"));

  assert.equal(store.tasks.length, 1);
  assert.equal(store.tasks[0].repeatScheduledFor.toISOString().slice(0, 10), "2026-04-03");
  assert.equal(store.tasks[0].repeatCarryCount, 2);
});

test("create separate repeat rules preserve missed work", async () => {
  const store = buildStore(buildRule("create_separate"));
  const service = new RepeatTaskService(store as never);

  await service.syncDueTasks(1, new Date("2026-04-03T12:00:00.000Z"));
  await service.syncDueTasks(1, new Date("2026-04-03T12:00:00.000Z"));

  assert.deepEqual(
    store.tasks.map((task) => task.repeatScheduledFor.toISOString().slice(0, 10)),
    ["2026-04-01", "2026-04-02", "2026-04-03"],
  );
});

