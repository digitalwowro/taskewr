import test from "node:test";
import assert from "node:assert/strict";

import { assertProjectMoveTargetExists, swapSortOrders } from "@/domain/projects/ordering";
import { ValidationError } from "@/domain/common/errors";

test("project ordering requires an adjacent move target", () => {
  assert.throws(
    () => assertProjectMoveTargetExists(null),
    (error) =>
      error instanceof ValidationError && error.code === "project_move_target_missing",
  );
});

test("project ordering swaps sort orders symmetrically", () => {
  assert.deepEqual(swapSortOrders(2, 3), {
    currentSortOrder: 3,
    targetSortOrder: 2,
  });
});
