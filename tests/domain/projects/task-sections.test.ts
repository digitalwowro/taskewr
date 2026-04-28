import assert from "node:assert/strict";
import test from "node:test";

import { splitProjectTaskSections } from "@/domain/projects/task-sections";
import type { TaskListItem } from "@/domain/tasks/types";

function task(input: Partial<TaskListItem> & { id: string }): TaskListItem {
  return {
    id: input.id,
    project: "Channel Sales",
    status: "Todo",
    statusValue: "todo",
    due: "No due date",
    dueDate: null,
    priority: "Medium",
    priorityValue: "medium",
    startDate: null,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    title: input.id,
    ...input,
  };
}

test("splitProjectTaskSections assigns each task to one project section", () => {
  const sections = splitProjectTaskSections([
    task({ id: "overdue", dueDate: "2026-04-01T00:00:00.000Z" }),
    task({ id: "active-future", dueDate: "2999-01-01T00:00:00.000Z" }),
    task({ id: "active-unscheduled", dueDate: null }),
    task({ id: "completed-overdue", statusValue: "done", dueDate: "2026-04-01T00:00:00.000Z" }),
  ]);

  assert.deepEqual(sections.overdue.map((item) => item.id), ["overdue"]);
  assert.deepEqual(sections.active.map((item) => item.id), [
    "active-future",
    "active-unscheduled",
  ]);
  assert.deepEqual(sections.completed.map((item) => item.id), ["completed-overdue"]);

  const assignedIds = [
    ...sections.overdue,
    ...sections.active,
    ...sections.completed,
  ].map((item) => item.id);
  assert.equal(new Set(assignedIds).size, assignedIds.length);
});
