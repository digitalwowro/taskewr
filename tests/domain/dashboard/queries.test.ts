import assert from "node:assert/strict";
import test from "node:test";

import { sortAndFilterTaskItems } from "@/domain/dashboard/queries";
import type { TaskFilters, TaskListItem } from "@/domain/tasks/types";

function task(input: Partial<TaskListItem> & { id: string }): TaskListItem {
  return {
    id: input.id,
    project: "Ops",
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

function filters(input: Partial<TaskFilters>): TaskFilters {
  return {
    sort: "priority",
    direction: "desc",
    status: [],
    priority: [],
    startDate: null,
    endDate: null,
    ...input,
  };
}

test("sortAndFilterTaskItems filters by status and priority", () => {
  const items = sortAndFilterTaskItems(
    [
      task({ id: "todo-low", statusValue: "todo", priorityValue: "low" }),
      task({ id: "done-high", statusValue: "done", priorityValue: "high" }),
      task({ id: "todo-high", statusValue: "todo", priorityValue: "high" }),
    ],
    filters({
      status: ["todo"],
      priority: ["high"],
    }),
  );

  assert.deepEqual(items.map((item) => item.id), ["todo-high"]);
});

test("sortAndFilterTaskItems supports status sorting", () => {
  const items = sortAndFilterTaskItems(
    [
      task({ id: "done", statusValue: "done" }),
      task({ id: "todo", statusValue: "todo" }),
      task({ id: "in-progress", statusValue: "in_progress" }),
    ],
    filters({
      sort: "status",
      direction: "asc",
    }),
  );

  assert.deepEqual(items.map((item) => item.id), ["todo", "in-progress", "done"]);
});
