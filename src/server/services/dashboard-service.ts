import { ProjectsRepository } from "@/data/prisma/repositories/projects-repository";
import { TasksRepository } from "@/data/prisma/repositories/tasks-repository";
import { normalizeTaskFilters } from "@/domain/common/filters";
import { filterTaskItems, sortTaskItems } from "@/domain/dashboard/queries";
import type { TaskFilters, TaskListItem } from "@/domain/tasks/types";
import { db } from "@/lib/db";
import { AppContextService } from "@/server/services/app-context-service";

export class DashboardService {
  constructor(
    private readonly projectsRepository = new ProjectsRepository(db),
    private readonly tasksRepository = new TasksRepository(db),
    private readonly contextService = new AppContextService(),
  ) {}

  async getProjectGroups(filters?: Partial<TaskFilters>) {
    const normalized = normalizeTaskFilters(filters);
    const context = await this.contextService.getAppContext();
    const projects = await this.projectsRepository.listProjects(context.workspaceId, false);

    const groups = await Promise.all(
      projects.map(async (project) => {
        const tasks = await this.tasksRepository.listProjectTasks(project.id);
        const mapped: TaskListItem[] = tasks.map((task) => ({
          id: `TSK-${task.id}`,
          title: task.title,
          project: project.name,
          status: task.status,
          statusValue: task.status as TaskListItem["statusValue"],
          due: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : "No due date",
          dueDate: task.dueDate ? task.dueDate.toISOString() : null,
          priority: task.priority,
          priorityValue: task.priority as TaskListItem["priorityValue"],
          startDate: task.startDate ? task.startDate.toISOString() : null,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        }));

        const filtered = sortTaskItems(filterTaskItems(mapped, normalized), normalized);

        return {
          id: project.id,
          name: project.name,
          count: filtered.length,
          items: filtered,
        };
      }),
    );

    return groups.filter((group) => group.items.length > 0);
  }
}
