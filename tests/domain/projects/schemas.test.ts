import test from "node:test";
import assert from "node:assert/strict";

import { projectMutationSchema, projectMoveSchema } from "@/domain/projects/schemas";

test("projectMutationSchema requires a non-empty project name", () => {
  assert.throws(
    () =>
      projectMutationSchema.parse({
        name: "   ",
        description: "Some description",
      }),
    /Too small/,
  );
});

test("projectMoveSchema restricts direction to adjacent moves", () => {
  assert.deepEqual(projectMoveSchema.parse({ direction: "up" }), { direction: "up" });
  assert.throws(() => projectMoveSchema.parse({ direction: "left" }), /Invalid option/);
});
