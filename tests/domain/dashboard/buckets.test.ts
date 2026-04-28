import assert from "node:assert/strict";
import test from "node:test";

import { bucketDashboardTasks } from "@/domain/dashboard/buckets";
import type { TaskListItem } from "@/domain/tasks/types";

function task(input: Partial<TaskListItem> & { id: string; dueDate: string | null }): TaskListItem {
  return {
    project: "Ops",
    status: "Todo",
    statusValue: "todo",
    due: input.dueDate ?? "No due date",
    priority: "Medium",
    priorityValue: "medium",
    startDate: null,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    title: input.id,
    ...input,
  };
}

test("dashboard buckets separate recurring and focus tasks", () => {
  const buckets = bucketDashboardTasks(
    [
      task({ id: "future", dueDate: "2026-04-03T00:00:00.000Z" }),
      task({ id: "focus-overdue", dueDate: "2026-04-01T00:00:00.000Z" }),
      task({ id: "done-overdue", dueDate: "2026-04-01T00:00:00.000Z", statusValue: "done" }),
      task({ id: "focus-today", dueDate: "2026-04-02T00:00:00.000Z" }),
      task({ id: "focus-unscheduled", dueDate: null }),
      task({ id: "repeat-overdue", dueDate: "2026-04-01T00:00:00.000Z", repeatRuleId: "1" }),
      task({
        id: "done-repeat-overdue",
        dueDate: "2026-04-01T00:00:00.000Z",
        repeatRuleId: "1",
        statusValue: "done",
      }),
      task({ id: "repeat-today", dueDate: "2026-04-02T00:00:00.000Z", repeatRuleId: "1" }),
      task({ id: "repeat-unscheduled", dueDate: null, repeatRuleId: "1" }),
    ],
    new Date("2026-04-02T12:00:00.000Z"),
    "UTC",
  );

  assert.deepEqual(buckets.recurringOverdueItems.map((item) => item.id), ["repeat-overdue"]);
  assert.deepEqual(buckets.recurringTodayItems.map((item) => item.id), [
    "repeat-today",
    "repeat-unscheduled",
  ]);
  assert.deepEqual(buckets.focusOverdueItems.map((item) => item.id), ["focus-overdue"]);
  assert.deepEqual(buckets.focusTodayItems.map((item) => item.id), [
    "focus-today",
    "focus-unscheduled",
  ]);
  assert.deepEqual(buckets.projectItems.map((item) => item.id), [
    "focus-overdue",
    "done-overdue",
    "focus-today",
    "focus-unscheduled",
    "repeat-overdue",
    "done-repeat-overdue",
    "repeat-today",
    "repeat-unscheduled",
  ]);
});
