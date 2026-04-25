import type { Prisma } from "@/generated/prisma/client";
import type { AppData, AppProject, ProjectGroup } from "@/app/app-data";
import type { TaskDetails, TaskFilters, TaskListItem } from "@/domain/tasks/types";
import { DEFAULT_TASK_FILTERS, normalizeTaskFilters } from "@/domain/common/filters";
import { filterTaskItems, sortTaskItems } from "@/domain/dashboard/queries";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/domain/tasks/constants";
import { AppContextService } from "@/server/services/app-context-service";
import { RepeatTaskService } from "@/server/services/repeat-task-service";
import { ProjectsRepository } from "@/data/prisma/repositories/projects-repository";
import { TasksRepository } from "@/data/prisma/repositories/tasks-repository";
import { db } from "@/lib/db";
import { formatDashboardDueLabel, isOverdueDate } from "@/lib/time/dashboard-dates";

const ACTIVE_STATUSES = new Set(["todo", "in_progress"]);
const DONE_STATUSES = new Set(["done", "canceled"]);
type AppTaskRecord = Prisma.TaskGetPayload<{
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

function formatUpdatedLabel(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
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

function formatArchivedLabel(date: Date | null) {
  if (!date) {
    return "Archived";
  }

  const now = new Date();
  const diffDays = Math.max(0, Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)));

  if (diffDays < 30) {
    return "Archived this month";
  }

  const diffMonths = Math.max(1, Math.floor(diffDays / 30));
  return `Archived ${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
}

function toTaskListItem(task: AppTaskRecord, timezone: string | null): TaskListItem {
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

function toTaskDetails(
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

export class AppDataService {
  constructor(
    private readonly projectsRepository = new ProjectsRepository(db),
    private readonly tasksRepository = new TasksRepository(db),
    private readonly contextService = new AppContextService(),
    private readonly repeatTaskService = new RepeatTaskService(),
  ) {}

  private async loadBaseRecords() {
    const context = await this.contextService.getAppContext();
    await this.repeatTaskService.syncDueTasks(context.workspaceId);
    const [projects, tasks] = await Promise.all([
      this.projectsRepository.listProjects(context.workspaceId, true),
      this.tasksRepository.listWorkspaceTasks(context.workspaceId),
    ]);

    return { projects, tasks, timezone: context.timezone };
  }

  private buildData(
    projects: Awaited<ReturnType<AppDataService["loadBaseRecords"]>>["projects"],
    tasks: Awaited<ReturnType<AppDataService["loadBaseRecords"]>>["tasks"],
    timezone: string | null,
    filtersInput?: Partial<TaskFilters>,
  ): AppData {
    const filters = normalizeTaskFilters(filtersInput ?? DEFAULT_TASK_FILTERS);
    const taskItems = tasks.map((task) => toTaskListItem(task, timezone));
    const projectTasksByProjectId = Object.fromEntries(
      projects.map((project) => [
        String(project.id),
        taskItems.filter((task) => task.projectId === String(project.id)),
      ]),
    );
    const taskDetails = Object.fromEntries(
      tasks.map((task) => [
        `TSK-${task.id}`,
        toTaskDetails(
          task,
          projects,
          tasks.filter((candidate) => candidate.projectId === task.projectId),
        ),
      ]),
    );

    const activeProjects: AppProject[] = projects
      .filter((project) => project.archivedAt === null)
      .map((project) => ({
        id: String(project.id),
        name: project.name,
        description: project.description ?? "",
        taskCount: project._count.tasks,
        updatedLabel: formatUpdatedLabel(project.updatedAt),
      }));

    const archivedProjects: AppProject[] = projects
      .filter((project) => project.archivedAt !== null)
      .map((project) => ({
        id: String(project.id),
        name: project.name,
        description: project.description ?? "",
        taskCount: project._count.tasks,
        isArchived: true,
        updatedLabel: formatArchivedLabel(project.archivedAt),
      }));

    const activeTasks = tasks.filter(
      (task) => task.project.archivedAt === null && !DONE_STATUSES.has(task.status),
    );

    const overdueItems = activeTasks
      .filter((task) => isOverdueDate(task.dueDate, new Date(), timezone))
      .map((task) => toTaskListItem(task, timezone));
    const filteredOverdueItems = sortTaskItems(
      filterTaskItems(overdueItems, filters),
      filters,
    );

    const todayPool = activeTasks
      .filter((task) => ACTIVE_STATUSES.has(task.status))
      .map((task) => toTaskListItem(task, timezone));

    const todayItems = sortTaskItems(
      filterTaskItems(todayPool, filters),
      filters,
    ).filter((item) => !filteredOverdueItems.some((overdue) => overdue.id === item.id));

    const projectGroupsMap = new Map<string, TaskListItem[]>();

    for (const item of taskItems) {
      if (!ACTIVE_STATUSES.has(item.statusValue)) {
        continue;
      }

      const groupItems = projectGroupsMap.get(item.project) ?? [];
      groupItems.push(item);
      projectGroupsMap.set(item.project, groupItems);
    }

    const groupedProjects: ProjectGroup[] = [...projectGroupsMap.entries()].map(([name, items]) => {
      const filteredItems = sortTaskItems(filterTaskItems(items, filters), filters);

      return {
        name,
        count: filteredItems.length,
        items: filteredItems,
      };
    });

    return {
      todayItems,
      overdueItems: filteredOverdueItems,
      groupedProjects,
      projectTasksByProjectId,
      activeProjects,
      archivedProjects,
      taskDetails,
    };
  }

  async getData(filtersInput?: Partial<TaskFilters>): Promise<AppData> {
    const { projects, tasks, timezone } = await this.loadBaseRecords();
    return this.buildData(projects, tasks, timezone, filtersInput);
  }

  async getDashboardData(filtersInput?: Partial<TaskFilters>) {
    const { projects, tasks, timezone } = await this.loadBaseRecords();
    return this.buildData(projects, tasks, timezone, filtersInput);
  }

  async getProjectsPageData() {
    const { projects, tasks, timezone } = await this.loadBaseRecords();
    return this.buildData(projects, tasks, timezone, DEFAULT_TASK_FILTERS);
  }

  async getDataForProject(projectId: string, filtersInput?: Partial<TaskFilters>) {
    const { projects, tasks, timezone } = await this.loadBaseRecords();
    const projectExists = projects.some((project) => String(project.id) === projectId);

    return projectExists ? this.buildData(projects, tasks, timezone, filtersInput) : null;
  }

  async getDataForTask(taskId: string, filtersInput?: Partial<TaskFilters>) {
    const { projects, tasks, timezone } = await this.loadBaseRecords();
    const taskExists = tasks.some((task) => String(task.id) === taskId);

    return taskExists ? this.buildData(projects, tasks, timezone, filtersInput) : null;
  }
}
