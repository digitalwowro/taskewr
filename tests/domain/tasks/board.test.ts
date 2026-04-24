import test from "node:test";
import assert from "node:assert/strict";

import { assertBoardMoveWithinProject, buildLaneOrderUpdates } from "@/domain/tasks/board";
import { ValidationError } from "@/domain/common/errors";

test("board moves must stay within the same project", () => {
  assert.throws(
    () => assertBoardMoveWithinProject(1, 2),
    (error) =>
      error instanceof ValidationError && error.code === "task_board_cross_project",
  );
});

test("board move lane updates reassign sort order sequentially", () => {
  assert.deepEqual(buildLaneOrderUpdates([214, 154, 160]), [
    { taskId: 214, sortOrder: 1 },
    { taskId: 154, sortOrder: 2 },
    { taskId: 160, sortOrder: 3 },
  ]);
});
