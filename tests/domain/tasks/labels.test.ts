import assert from "node:assert/strict";
import test from "node:test";

import { normalizeLabelName, normalizeLabelNames } from "@/domain/tasks/labels";

test("normalizeLabelName trims, lowercases, and collapses whitespace", () => {
  assert.equal(normalizeLabelName("  Test   Label  "), "test label");
});

test("normalizeLabelNames removes blank labels and duplicates", () => {
  assert.deepEqual(
    normalizeLabelNames(["Customer", " customer ", "  ", "Follow   Up"]),
    ["customer", "follow up"],
  );
});
