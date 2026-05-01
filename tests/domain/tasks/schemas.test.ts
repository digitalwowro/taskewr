import test from "node:test";
import assert from "node:assert/strict";

import { taskFiltersSchema, taskMutationSchema } from "@/domain/tasks/schemas";

test("taskFiltersSchema applies the product default filters", () => {
  const parsed = taskFiltersSchema.parse({});

  assert.equal(parsed.view, "list");
  assert.equal(parsed.sort, "priority");
  assert.equal(parsed.direction, "desc");
  assert.deepEqual(parsed.status, ["todo", "in_progress"]);
  assert.deepEqual(parsed.priority, []);
});

test("taskMutationSchema rejects due dates before the start date", () => {
  assert.throws(
    () =>
      taskMutationSchema.parse({
        projectId: 1,
        title: "Review rollout notes",
        status: "todo",
        priority: "medium",
        startDate: "2026-04-10",
        dueDate: "2026-04-09",
      }),
    /Due date must be on or after start date\./,
  );
});

test("taskMutationSchema validates due reminder time", () => {
  assert.equal(
    taskMutationSchema.parse({
      projectId: 1,
      title: "Review rollout notes",
      status: "todo",
      priority: "medium",
      dueDate: "2026-04-10",
      dueReminderTime: "09:30",
    }).dueReminderTime,
    "09:30",
  );

  assert.throws(
    () =>
      taskMutationSchema.parse({
        projectId: 1,
        title: "Review rollout notes",
        status: "todo",
        priority: "medium",
        dueReminderTime: "09:30",
      }),
    /Reminder time requires a due date\./,
  );

  assert.throws(
    () =>
      taskMutationSchema.parse({
        projectId: 1,
        title: "Review rollout notes",
        status: "todo",
        priority: "medium",
        dueDate: "2026-04-10",
        dueReminderTime: "24:00",
      }),
    /Reminder time must use HH:mm format\./,
  );
});
