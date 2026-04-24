import test from "node:test";
import assert from "node:assert/strict";

import {
  assertCanMarkTaskDone,
  assertNoHierarchyCycle,
  assertSameProjectParent,
  assertTaskNotSelfParent,
  assertTaskProjectChangeAllowed,
} from "@/domain/tasks/hierarchy";
import { ValidationError } from "@/domain/common/errors";

test("hierarchy rejects self-parenting", () => {
  assert.throws(
    () => assertTaskNotSelfParent(145, 145),
    (error) =>
      error instanceof ValidationError && error.code === "task_self_parent",
  );
});

test("hierarchy rejects cross-project parents", () => {
  assert.throws(
    () => assertSameProjectParent(4, 1),
    (error) =>
      error instanceof ValidationError && error.code === "task_parent_cross_project",
  );
});

test("hierarchy rejects cycles", () => {
  assert.throws(
    () =>
      assertNoHierarchyCycle(10, 11, [
        { id: 10, projectId: 1, parentTaskId: null, status: "todo" },
        { id: 11, projectId: 1, parentTaskId: 12, status: "todo" },
        { id: 12, projectId: 1, parentTaskId: 10, status: "todo" },
      ]),
    (error) =>
      error instanceof ValidationError && error.code === "task_parent_cycle",
  );
});

test("hierarchy blocks completing a task while descendants are active", () => {
  assert.throws(
    () =>
      assertCanMarkTaskDone(10, [
        { id: 10, projectId: 1, parentTaskId: null, status: "todo" },
        { id: 11, projectId: 1, parentTaskId: 10, status: "in_progress" },
        { id: 12, projectId: 1, parentTaskId: 11, status: "done" },
      ]),
    (error) =>
      error instanceof ValidationError && error.code === "task_descendants_incomplete",
  );
});

test("hierarchy blocks project changes for tasks with parent or child links", () => {
  assert.throws(
    () =>
      assertTaskProjectChangeAllowed({
        currentProjectId: 1,
        nextProjectId: 2,
        parentTaskId: null,
        childTaskCount: 1,
      }),
    (error) =>
      error instanceof ValidationError &&
      error.code === "task_project_change_breaks_hierarchy",
  );
});
