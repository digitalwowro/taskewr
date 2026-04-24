import test from "node:test";
import assert from "node:assert/strict";

import {
  assertProjectCanArchive,
  assertProjectCanUnarchive,
  nextUnarchivedSortOrder,
} from "@/domain/projects/archive";
import { ValidationError } from "@/domain/common/errors";

test("archive rules reject archiving an already archived project", () => {
  assert.throws(
    () => assertProjectCanArchive(true),
    (error) =>
      error instanceof ValidationError && error.code === "project_already_archived",
  );
});

test("archive rules reject unarchiving an active project", () => {
  assert.throws(
    () => assertProjectCanUnarchive(false),
    (error) =>
      error instanceof ValidationError && error.code === "project_not_archived",
  );
});

test("unarchived projects move to the end of the active ordering", () => {
  assert.equal(nextUnarchivedSortOrder(null), 1);
  assert.equal(nextUnarchivedSortOrder(4), 5);
});
