import type { AppProject } from "@/app/app-data";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/domain/tasks/constants";
import type { TaskDetails, TaskListItem } from "@/domain/tasks/types";
import type { Prisma } from "@/generated/prisma/client";
import { formatDashboardDueLabel } from "@/lib/time/dashboard-dates";

export type AppTaskRecord = Prisma.TaskGetPayload<{
  include: {
    project: true;
    parentTask: true;
    repeatRule: true;
    taskLabels: {
      include: {
        label: true;
      };
    };
  };
}>;

export type AppProjectRecord = {
  id: number;
  name: string;
  description: string | null;
  archivedAt: Date | null;
  updatedAt: Date;
  _count: {
    tasks: number;
  };
};

export function formatUpdatedLabel(date: Date, referenceDate = new Date()) {
  const diffMs = referenceDate.getTime() - date.getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  if (diffHours < 1) {
    return "Updated just now";
  }

  if (diffHours < 24) {
    return `Updated ${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 1) {
    return "Updated yesterday";
  }

  return `Updated ${diffDays}d ago`;
}

export function formatArchivedLabel(date: Date | null, referenceDate = new Date()) {
  if (!date) {
    return "Archived";
  }

  const diffDays = Math.max(
    0,
    Math.floor((referenceDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)),
  );

  if (diffDays < 30) {
    return "Archived this month";
  }

  const diffMonths = Math.max(1, Math.floor(diffDays / 30));
  return `Archived ${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
}

export function toTaskListItem(task: AppTaskRecord, timezone: string | null): TaskListItem {
  const statusLabel =
    TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS] ??
    task.status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
  const priorityLabel =
    TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS] ??
    task.priority.replace(/\b\w/g, (char) => char.toUpperCase());

  return {
    id: `TSK-${task.id}`,
    projectId: String(task.projectId),
    title: task.title,
    project: task.project.name,
    status: statusLabel,
    statusValue: task.status as TaskListItem["statusValue"],
    due: formatDashboardDueLabel(task.dueDate, new Date(), timezone),
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    priority: priorityLabel,
    priorityValue: task.priority as TaskListItem["priorityValue"],
    startDate: task.startDate ? task.startDate.toISOString() : null,
    repeatRuleId: task.repeatRuleId ? String(task.repeatRuleId) : null,
    repeatScheduledFor: task.repeatScheduledFor ? task.repeatScheduledFor.toISOString() : null,
    repeatCarryCount: task.repeatCarryCount,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function toTaskDetails(
  task: AppTaskRecord,
  projects: { id: number; name: string; archivedAt: Date | null }[],
  siblingTasks: AppTaskRecord[],
): TaskDetails {
  return {
    projectId: String(task.projectId),
    description: task.description ?? "",
    parentTaskId: task.parentTaskId ? String(task.parentTaskId) : "",
    parentTask: task.parentTask?.title ?? "",
    labels: task.taskLabels.map((item) => item.label.name),
    repeat: task.repeatRule
      ? {
          enabled: task.repeatRule.isActive,
          scheduleType: task.repeatRule.scheduleType as NonNullable<TaskDetails["repeat"]>["scheduleType"],
          interval: task.repeatRule.interval,
          weekdays: Array.isArray(task.repeatRule.weekdays)
            ? task.repeatRule.weekdays.filter((item): item is number => Number.isInteger(item))
            : [],
          monthDay: task.repeatRule.monthDay,
          specificDates: Array.isArray(task.repeatRule.specificDates)
            ? task.repeatRule.specificDates.filter((item): item is string => typeof item === "string")
            : [],
          incompleteBehavior: task.repeatRule.incompleteBehavior as NonNullable<TaskDetails["repeat"]>["incompleteBehavior"],
        }
      : {
          enabled: false,
          scheduleType: "interval_days",
          interval: 1,
          weekdays: [],
          monthDay: null,
          specificDates: [],
          incompleteBehavior: "carry_forward",
        },
    startDateValue: task.startDate ? task.startDate.toISOString().slice(0, 10) : "",
    dueDateValue: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : "",
    projectOptions: projects
      .filter((project) => project.archivedAt === null)
      .map((project) => ({ id: String(project.id), name: project.name })),
    parentTaskOptions: siblingTasks
      .filter((siblingTask) => siblingTask.id !== task.id)
      .map((siblingTask) => ({ id: String(siblingTask.id), title: siblingTask.title })),
  };
}

export function toActiveProjectCard(project: AppProjectRecord, referenceDate = new Date()): AppProject {
  return {
    id: String(project.id),
    name: project.name,
    description: project.description ?? "",
    taskCount: project._count.tasks,
    updatedLabel: formatUpdatedLabel(project.updatedAt, referenceDate),
  };
}

export function toArchivedProjectCard(project: AppProjectRecord, referenceDate = new Date()): AppProject {
  return {
    id: String(project.id),
    name: project.name,
    description: project.description ?? "",
    taskCount: project._count.tasks,
    isArchived: true,
    updatedLabel: formatArchivedLabel(project.archivedAt, referenceDate),
  };
}
