import { getAppUrl } from "@/lib/env";
import { dateOnlyString } from "@/domain/tasks/notification-schedule";
import { sendEmail, type EmailMessage } from "@/server/email/smtp";

type TaskDueReminderEmailInput = {
  to: string;
  name: string;
  taskId: number;
  taskTitle: string;
  projectName: string;
  dueDate: Date;
  dueReminderTime: string;
  timezone: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDueLabel(input: Pick<TaskDueReminderEmailInput, "dueDate" | "dueReminderTime" | "timezone">) {
  const timezone = input.timezone || "UTC";
  return `${dateOnlyString(input.dueDate)} at ${input.dueReminderTime} ${timezone}`;
}

export function buildTaskDueReminderEmail(input: TaskDueReminderEmailInput): EmailMessage {
  const taskUrl = new URL(`/tasks/${input.taskId}`, getAppUrl());
  const dueLabel = formatDueLabel(input);
  const safeName = escapeHtml(input.name);
  const safeTaskTitle = escapeHtml(input.taskTitle);
  const safeProjectName = escapeHtml(input.projectName);
  const safeDueLabel = escapeHtml(dueLabel);
  const safeUrl = escapeHtml(taskUrl.toString());

  return {
    to: input.to,
    subject: `Task due: ${input.taskTitle}`,
    text: [
      `Hi ${input.name},`,
      "",
      `The task "${input.taskTitle}" is due ${dueLabel}.`,
      `Project: ${input.projectName}`,
      "",
      taskUrl.toString(),
    ].join("\n"),
    html: [
      `<p>Hi ${safeName},</p>`,
      `<p>The task <strong>${safeTaskTitle}</strong> is due ${safeDueLabel}.</p>`,
      `<p>Project: ${safeProjectName}</p>`,
      `<p><a href="${safeUrl}">Open task</a></p>`,
    ].join(""),
  };
}

export async function sendTaskDueReminderEmail(input: TaskDueReminderEmailInput) {
  await sendEmail(buildTaskDueReminderEmail(input));
}
