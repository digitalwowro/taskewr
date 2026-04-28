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

    const projectGroupsMap = new Map<string, TaskListItem[]>();

    for (const item of dashboardBuckets.projectItems) {
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
      recurringOverdueItems,
      recurringTodayItems,
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
