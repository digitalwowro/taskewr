import assert from "node:assert/strict";
import test from "node:test";

import {
  isDueReminderTime,
  scheduledAtForDueReminder,
} from "@/domain/tasks/notification-schedule";

test("isDueReminderTime accepts only HH:mm clock values", () => {
  assert.equal(isDueReminderTime("00:00"), true);
  assert.equal(isDueReminderTime("23:59"), true);
  assert.equal(isDueReminderTime("9:30"), false);
  assert.equal(isDueReminderTime("24:00"), false);
});

test("scheduledAtForDueReminder converts local task due time to UTC", () => {
  assert.equal(
    scheduledAtForDueReminder({
      dueDate: new Date("2026-05-01T00:00:00.000Z"),
      dueReminderTime: "09:30",
      timezone: "Europe/Bucharest",
    }).toISOString(),
    "2026-05-01T06:30:00.000Z",
  );

  assert.equal(
    scheduledAtForDueReminder({
      dueDate: new Date("2026-01-15T00:00:00.000Z"),
      dueReminderTime: "09:30",
      timezone: "Europe/Bucharest",
    }).toISOString(),
    "2026-01-15T07:30:00.000Z",
  );
});

test("scheduledAtForDueReminder falls back to UTC for invalid timezones", () => {
  assert.equal(
    scheduledAtForDueReminder({
      dueDate: new Date("2026-05-01T00:00:00.000Z"),
      dueReminderTime: "09:30",
      timezone: "Not/AZone",
    }).toISOString(),
    "2026-05-01T09:30:00.000Z",
  );
});
