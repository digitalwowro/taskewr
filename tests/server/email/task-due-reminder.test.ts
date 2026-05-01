import assert from "node:assert/strict";
import test from "node:test";

import { buildTaskDueReminderEmail } from "@/server/email/task-due-reminder";

test("buildTaskDueReminderEmail includes task due context and link", () => {
  const email = buildTaskDueReminderEmail({
    to: "r@example.com",
    name: "R",
    taskId: 42,
    taskTitle: "Review rollout",
    projectName: "Service",
    dueDate: new Date("2026-05-01T00:00:00.000Z"),
    dueReminderTime: "09:30",
    timezone: "Europe/Bucharest",
  });

  assert.equal(email.to, "r@example.com");
  assert.equal(email.subject, "Task due: Review rollout");
  assert.match(email.text, /2026-05-01 at 09:30 Europe\/Bucharest/);
  assert.match(email.text, /http:\/\/localhost:3000\/tasks\/42/);
  assert.match(email.html, /Open task/);
});
