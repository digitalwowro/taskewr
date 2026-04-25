import assert from "node:assert/strict";
import test from "node:test";

import {
  getNextRepeatDueDate,
  getRepeatDueDatesThrough,
} from "@/domain/tasks/repeat-schedule";

test("interval day schedules include every Nth day", () => {
  assert.deepEqual(
    getRepeatDueDatesThrough(
      {
        scheduleType: "interval_days",
        interval: 3,
        weekdays: [],
        monthDay: null,
        specificDates: [],
      },
      "2026-04-01",
      "2026-04-10",
    ),
    ["2026-04-01", "2026-04-04", "2026-04-07", "2026-04-10"],
  );
});

test("weekly schedules respect selected weekdays and week interval", () => {
  assert.deepEqual(
    getRepeatDueDatesThrough(
      {
        scheduleType: "weekly",
        interval: 2,
        weekdays: [1, 5],
        monthDay: null,
        specificDates: [],
      },
      "2026-04-01",
      "2026-04-30",
    ),
    ["2026-04-03", "2026-04-13", "2026-04-17", "2026-04-27"],
  );
});

test("monthly schedules clamp missing month days", () => {
  assert.deepEqual(
    getRepeatDueDatesThrough(
      {
        scheduleType: "monthly",
        interval: 1,
        weekdays: [],
        monthDay: 31,
        specificDates: [],
      },
      "2026-02-01",
      "2026-04-30",
    ),
    ["2026-02-28", "2026-03-31", "2026-04-30"],
  );
});

test("specific date schedules use unique sorted dates", () => {
  assert.deepEqual(
    getRepeatDueDatesThrough(
      {
        scheduleType: "specific_dates",
        interval: 1,
        weekdays: [],
        monthDay: null,
        specificDates: ["2026-05-10", "2026-05-01", "2026-05-10"],
      },
      "2026-05-01",
      "2026-05-31",
    ),
    ["2026-05-01", "2026-05-10"],
  );
});

test("next due date searches after the supplied date", () => {
  assert.equal(
    getNextRepeatDueDate(
      {
        scheduleType: "interval_days",
        interval: 1,
        weekdays: [],
        monthDay: null,
        specificDates: [],
      },
      "2026-04-01",
      "2026-04-01",
    ),
    "2026-04-02",
  );
});

