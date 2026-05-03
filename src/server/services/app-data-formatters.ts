import type { AppProject } from "@/app/app-data";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/domain/tasks/constants";
import type { TaskStatus } from "@/domain/tasks/constants";
import type { TaskDetails, TaskListItem } from "@/domain/tasks/types";
import type { Prisma } from "@/generated/prisma/client";
import { formatDashboardDueLabel } from "@/lib/time/dashboard-dates";

export type AppTaskRecord = Prisma.TaskGetPayload<{
  include: {
    project: {
      include: {
        workspace: true;
      };
    };
    parentTask: true;
    creator: {
      select: {
        id: true;
        name: true;
        email: true;
        avatarUrl: true;
      };
    };
    assignee: {
      select: {
        id: true;
        name: true;
        email: true;
        avatarUrl: true;
      };
    };
    repeatRule: true;
    taskLabels: {
      include: {
        label: true;
      };
    };
    links: {
      include: {
        createdBy: {
          select: {
            id: true;
            name: true;
            email: true;
            avatarUrl: true;
          };
        };
      };
    };
    attachments: {
      include: {
        uploadedBy: {
          select: {
            id: true;
            name: true;
            email: true;
            avatarUrl: true;
          };
        };
      };
    };
    timeEntries: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
            avatarUrl: true;
          };
        };
        createdBy: {
          select: {
            id: true;
            name: true;
            email: true;
            avatarUrl: true;
          };
        };
      };
    };
    notificationSubscriptions: {
      select: {
        userId: true;
      };
    };
  };
}>;

export type AppProjectRecord = {
  id: number;
  name: string;
  description: string | null;
  workspaceId: number | null;
  workspace: {
    name: string;
  } | null;
  members?: Array<{
    role: string;
    user: {
      id: number;
      name: string;
      email: string;
      avatarUrl: string | null;
      deactivatedAt: Date | null;
    };
  }>;
  archivedAt: Date | null;
  updatedAt: Date;
	  _count: {
	    tasks: number;
	    members: number;
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

export function toTaskListItem(
  task: AppTaskRecord,
  timezone: string | null,
  currentUserId?: number,
): TaskListItem {
  const statusLabel =
    TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS] ??
    task.status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
  const priorityLabel =
    TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS] ??
    task.priority.replace(/\b\w/g, (char) => char.toUpperCase());
  const notificationSubscriptions = task.notificationSubscriptions ?? [];

  return {
    id: `TSK-${task.id}`,
    projectId: String(task.projectId),
    workspaceId: task.project.workspaceId ? String(task.project.workspaceId) : null,
    workspaceName: task.project.workspace?.name ?? "No workspace",
    title: task.title,
    project: task.project.name,
    status: statusLabel,
    statusValue: task.status as TaskListItem["statusValue"],
    due: formatDashboardDueLabel(task.dueDate, new Date(), timezone),
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    dueReminderTime: task.dueReminderTime,
    isSubscribedToNotifications:
      currentUserId !== undefined
        ? notificationSubscriptions.some((subscription) => subscription.userId === currentUserId)
        : false,
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
  projects: Array<{
    id: number;
    name: string;
    archivedAt: Date | null;
    workspace?: { name: string } | null;
    members?: AppProjectRecord["members"];
  }>,
  siblingTasks: AppTaskRecord[],
  currentUserId?: number,
): TaskDetails {
  const taskProject = projects.find((project) => project.id === task.projectId);
  const actorProjectRole =
    currentUserId !== undefined
      ? taskProject?.members?.find((member) => member.user.id === currentUserId)?.role
      : undefined;
  const activeAssigneeOptionsByProjectId = Object.fromEntries(
    projects.map((project) => [
      String(project.id),
      (project.members ?? [])
        .filter((member) => member.user.deactivatedAt === null)
        .map((member) => ({
          id: String(member.user.id),
          name: member.user.name,
          email: member.user.email,
          avatarUrl: member.user.avatarUrl,
        })),
    ]),
  );

  return {
    projectId: String(task.projectId),
    description: task.description ?? "",
    currentUserId: currentUserId !== undefined ? String(currentUserId) : undefined,
    actorProjectRole,
    createdBy: task.creator
      ? {
          id: String(task.creator.id),
          name: task.creator.name,
          email: task.creator.email,
          avatarUrl: task.creator.avatarUrl,
        }
      : undefined,
    assigneeId: task.assigneeUserId ? String(task.assigneeUserId) : "",
    assigneeOptions: activeAssigneeOptionsByProjectId[String(task.projectId)] ?? [],
    assigneeOptionsByProjectId: activeAssigneeOptionsByProjectId,
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
    dueReminderTime: task.dueReminderTime ?? "",
    projectOptions: projects
      .filter((project) => project.archivedAt === null)
      .map((project) => ({
        id: String(project.id),
        name: project.name,
        workspaceName: project.workspace?.name ?? "No workspace",
      })),
    parentTaskOptions: siblingTasks
      .filter((siblingTask) => siblingTask.id !== task.id)
      .map((siblingTask) => ({ id: String(siblingTask.id), title: siblingTask.title })),
    subtasks: siblingTasks
      .filter((siblingTask) => siblingTask.parentTaskId === task.id)
      .map((subtask) => ({
        id: `TSK-${subtask.id}`,
        title: subtask.title,
        status: TASK_STATUS_LABELS[subtask.status as keyof typeof TASK_STATUS_LABELS] ?? subtask.status,
        statusValue: subtask.status as TaskStatus,
      })),
    links: (task.links ?? []).map((link) => ({
      id: String(link.id),
      title: link.title,
      url: link.url,
      host: formatLinkHost(link.url),
      createdAt: link.createdAt.toISOString(),
      createdBy: link.createdBy
        ? {
            id: String(link.createdBy.id),
            name: link.createdBy.name,
            email: link.createdBy.email,
            avatarUrl: link.createdBy.avatarUrl,
          }
        : undefined,
    })),
    attachments: (task.attachments ?? []).map((attachment) => ({
      id: String(attachment.id),
      fileName: attachment.originalFileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      createdAt: attachment.createdAt.toISOString(),
      uploadedBy: attachment.uploadedBy
        ? {
            id: String(attachment.uploadedBy.id),
            name: attachment.uploadedBy.name,
            email: attachment.uploadedBy.email,
            avatarUrl: attachment.uploadedBy.avatarUrl,
          }
        : undefined,
    })),
    timeEntries: (task.timeEntries ?? []).map((entry) => ({
      id: String(entry.id),
      minutes: entry.minutes,
      createdAt: entry.createdAt.toISOString(),
      user: {
        id: String(entry.user.id),
        name: entry.user.name,
        email: entry.user.email,
        avatarUrl: entry.user.avatarUrl,
      },
      createdBy: entry.createdBy
        ? {
            id: String(entry.createdBy.id),
            name: entry.createdBy.name,
            email: entry.createdBy.email,
            avatarUrl: entry.createdBy.avatarUrl,
          }
        : undefined,
    })),
  };
}

function formatLinkHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function toActiveProjectCard(project: AppProjectRecord, referenceDate = new Date()): AppProject {
  return {
    id: String(project.id),
    workspaceId: project.workspaceId ? String(project.workspaceId) : null,
    workspaceName: project.workspace?.name ?? "No workspace",
    name: project.name,
	    description: project.description ?? "",
	    taskCount: project._count.tasks,
	    memberCount: project._count.members,
	    updatedLabel: formatUpdatedLabel(project.updatedAt, referenceDate),
	  };
	}

export function toArchivedProjectCard(project: AppProjectRecord, referenceDate = new Date()): AppProject {
  return {
    id: String(project.id),
    workspaceId: project.workspaceId ? String(project.workspaceId) : null,
    workspaceName: project.workspace?.name ?? "No workspace",
    name: project.name,
	    description: project.description ?? "",
	    taskCount: project._count.tasks,
	    memberCount: project._count.members,
	    isArchived: true,
	    updatedLabel: formatArchivedLabel(project.archivedAt, referenceDate),
	  };
}
