import test from "node:test";
import assert from "node:assert/strict";

import {
  formatDashboardDueLabel,
  getRelativeDayOffset,
  isOverdueDate,
} from "@/lib/time/dashboard-dates";

test("timezone day offsets respect the viewer timezone", () => {
  const reference = new Date("2026-04-02T23:30:00.000Z");
  const target = new Date("2026-04-02T00:00:00.000Z");

  assert.equal(getRelativeDayOffset(target, reference, "UTC"), 0);
  assert.equal(getRelativeDayOffset(target, reference, "America/Los_Angeles"), -1);
});

test("formatDashboardDueLabel returns overdue and today labels in timezone context", () => {
  const reference = new Date("2026-04-02T23:30:00.000Z");

  assert.equal(
    formatDashboardDueLabel(new Date("2026-04-02T00:00:00.000Z"), reference, "UTC"),
    "Today",
  );
  assert.equal(
    formatDashboardDueLabel(
      new Date("2026-04-02T00:00:00.000Z"),
      reference,
      "America/Los_Angeles",
    ),
    "1 day overdue",
  );
  assert.equal(
    formatDashboardDueLabel(new Date("2026-04-03T00:00:00.000Z"), reference, "UTC"),
    "Tomorrow",
  );
});

test("isOverdueDate matches timezone-aware due logic", () => {
  const reference = new Date("2026-04-02T23:30:00.000Z");
  const target = new Date("2026-04-02T00:00:00.000Z");

  assert.equal(isOverdueDate(target, reference, "UTC"), false);
  assert.equal(isOverdueDate(target, reference, "America/Los_Angeles"), true);
});
