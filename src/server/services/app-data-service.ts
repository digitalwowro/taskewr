import type { AppData, ProjectGroup } from "@/app/app-data";
import type { TaskFilters, TaskListItem } from "@/domain/tasks/types";
import { DEFAULT_TASK_FILTERS, normalizeTaskFilters } from "@/domain/common/filters";
import { bucketDashboardTasks } from "@/domain/dashboard/buckets";
import { filterTaskItems, sortTaskItems } from "@/domain/dashboard/queries";
import { AppContextService } from "@/server/services/app-context-service";
import { RepeatTaskService } from "@/server/services/repeat-task-service";
import { ProjectsRepository } from "@/data/prisma/repositories/projects-repository";
import { TasksRepository } from "@/data/prisma/repositories/tasks-repository";
import { db } from "@/lib/db";
import {
  toActiveProjectCard,
  toArchivedProjectCard,
  toTaskDetails,
  toTaskListItem,
} from "@/server/services/app-data-formatters";

const ACTIVE_STATUSES = new Set(["todo", "in_progress"]);
const DONE_STATUSES = new Set(["done", "canceled"]);

export class AppDataService {
  constructor(
    private readonly projectsRepository = new ProjectsRepository(db),
    private readonly tasksRepository = new TasksRepository(db),
    private readonly contextService = new AppContextService(),
    private readonly repeatTaskService = new RepeatTaskService(),
  ) {}

  private async loadBaseRecords() {
    const context = await this.contextService.getAppContext();
    await this.repeatTaskService.syncDueTasksForProjects(context.accessibleProjectIds);
    const [projects, tasks, labels] = await Promise.all([
      this.projectsRepository.listProjectsByIds(context.accessibleProjectIds, true),
      this.tasksRepository.listTasksForProjects(context.accessibleProjectIds),
      this.tasksRepository.listLabels(),
    ]);

    return {
      currentUser: {
        id: context.actorUserId,
        appRole: context.appRole,
      },
      projects,
      tasks,
      labels,
      timezone: context.timezone,
      workspaces: context.workspaces,
    };
  }

  private buildData(
    projects: Awaited<ReturnType<AppDataService["loadBaseRecords"]>>["projects"],
    tasks: Awaited<ReturnType<AppDataService["loadBaseRecords"]>>["tasks"],
    labels: Awaited<ReturnType<AppDataService["loadBaseRecords"]>>["labels"],
    timezone: string | null,
    workspaces: Awaited<ReturnType<AppDataService["loadBaseRecords"]>>["workspaces"],
    currentUser: Awaited<ReturnType<AppDataService["loadBaseRecords"]>>["currentUser"],
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

    const activeProjects = projects
      .filter((project) => project.archivedAt === null)
      .map((project) => toActiveProjectCard(project));

    const archivedProjects = projects
      .filter((project) => project.archivedAt !== null)
      .map((project) => toArchivedProjectCard(project));

    const activeTasks = tasks.filter(
      (task) => task.project.archivedAt === null && !DONE_STATUSES.has(task.status),
    );

    const activeTaskItems = activeTasks.map((task) => toTaskListItem(task, timezone));
    const dashboardBuckets = bucketDashboardTasks(activeTaskItems, new Date(), timezone);
    const overdueItems = dashboardBuckets.focusOverdueItems;
    const filteredOverdueItems = sortTaskItems(
      filterTaskItems(overdueItems, filters),
      filters,
    );
    const recurringOverdueItems = sortTaskItems(
      filterTaskItems(dashboardBuckets.recurringOverdueItems, filters),
      filters,
    );
    const recurringTodayItems = sortTaskItems(
      filterTaskItems(dashboardBuckets.recurringTodayItems, filters),
      filters,
    );

    const todayItems = sortTaskItems(
      filterTaskItems(dashboardBuckets.focusTodayItems, filters),
      filters,
    );

    const projectById = new Map(projects.map((project) => [String(project.id), project]));
    const projectGroupsMap = new Map<string, TaskListItem[]>();

    for (const item of dashboardBuckets.projectItems) {
      if (!ACTIVE_STATUSES.has(item.statusValue)) {
        continue;
      }

      const projectId = item.projectId ?? "";
      const groupItems = projectGroupsMap.get(projectId) ?? [];
      groupItems.push(item);
      projectGroupsMap.set(projectId, groupItems);
    }

    const groupedProjects: ProjectGroup[] = [...projectGroupsMap.entries()].map(([projectId, items]) => {
      const filteredItems = sortTaskItems(filterTaskItems(items, filters), filters);
      const project = projectById.get(projectId);

      return {
        id: projectId,
        name: project?.name ?? items[0]?.project ?? "Project",
        workspaceId: project?.workspaceId ? String(project.workspaceId) : null,
        workspaceName: project?.workspace?.name ?? "No workspace",
        count: filteredItems.length,
        items: filteredItems,
      };
    });

    return {
      currentUser,
      workspaces: workspaces.map((workspace) => ({
        id: String(workspace.id),
        name: workspace.name,
        slug: workspace.slug,
        role: workspace.role,
      })),
      recurringOverdueItems,
      recurringTodayItems,
      todayItems,
      overdueItems: filteredOverdueItems,
      groupedProjects,
      projectTasksByProjectId,
      activeProjects,
      archivedProjects,
      taskDetails,
      labels: labels.map((label) => label.name),
    };
  }

  async getData(filtersInput?: Partial<TaskFilters>): Promise<AppData> {
    const { projects, tasks, labels, timezone, workspaces, currentUser } = await this.loadBaseRecords();
    return this.buildData(projects, tasks, labels, timezone, workspaces, currentUser, filtersInput);
  }

  async getDashboardData(filtersInput?: Partial<TaskFilters>) {
    const { projects, tasks, labels, timezone, workspaces, currentUser } = await this.loadBaseRecords();
    return this.buildData(projects, tasks, labels, timezone, workspaces, currentUser, filtersInput);
  }

  async getProjectsPageData() {
    const { projects, tasks, labels, timezone, workspaces, currentUser } = await this.loadBaseRecords();
    return this.buildData(projects, tasks, labels, timezone, workspaces, currentUser, DEFAULT_TASK_FILTERS);
  }

  async getUsersPageData() {
    const { projects, tasks, labels, timezone, workspaces, currentUser } = await this.loadBaseRecords();
    return this.buildData(projects, tasks, labels, timezone, workspaces, currentUser, DEFAULT_TASK_FILTERS);
  }

  async getWorkspacesPageData() {
    const { projects, tasks, labels, timezone, workspaces, currentUser } = await this.loadBaseRecords();
    return this.buildData(projects, tasks, labels, timezone, workspaces, currentUser, DEFAULT_TASK_FILTERS);
  }

  async getDataForProject(projectId: string, filtersInput?: Partial<TaskFilters>) {
    const { projects, tasks, labels, timezone, workspaces, currentUser } = await this.loadBaseRecords();
    const projectExists = projects.some((project) => String(project.id) === projectId);

    return projectExists ? this.buildData(projects, tasks, labels, timezone, workspaces, currentUser, filtersInput) : null;
  }

  async getDataForTask(taskId: string, filtersInput?: Partial<TaskFilters>) {
    const { projects, tasks, labels, timezone, workspaces, currentUser } = await this.loadBaseRecords();
    const taskExists = tasks.some((task) => String(task.id) === taskId);

    return taskExists ? this.buildData(projects, tasks, labels, timezone, workspaces, currentUser, filtersInput) : null;
  }
}
