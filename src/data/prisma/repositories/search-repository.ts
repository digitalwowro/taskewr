import type { PrismaClient } from "@/generated/prisma/client";

import type { TaskSearchInput, TaskSearchResult } from "@/domain/search/schemas";
import { TASK_PRIORITY_RANK, type TaskPriority } from "@/domain/tasks/constants";

function priorityRank(priority: string) {
  return TASK_PRIORITY_RANK[priority as TaskPriority] ?? 0;
}

function completedRank(status: string) {
  return status === "done" ? 1 : 0;
}

export class SearchRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async searchTasks(input: TaskSearchInput): Promise<TaskSearchResult[]> {
    const query = input.query.trim();

    const rows = await this.prisma.task.findMany({
      where: {
        ...(input.workspaceId
          ? {
              project: {
                workspaceId: input.workspaceId,
                ...(input.includeArchivedProjects ? {} : { archivedAt: null }),
              },
            }
          : input.includeArchivedProjects
            ? {}
            : {
                project: {
                  archivedAt: null,
                },
              }),
        ...(query === ""
          ? {}
          : {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            }),
        ...(input.status.length > 0
          ? {
              status: {
                in: input.status,
              },
            }
          : {}),
        ...(input.priority.length > 0
          ? {
              priority: {
                in: input.priority,
              },
            }
          : {}),
      },
      take: input.limit,
      orderBy:
        input.sort === "created_at"
          ? { createdAt: input.direction }
          : input.sort === "updated_at"
            ? { updatedAt: input.direction }
            : input.sort === "start_date"
              ? { startDate: input.direction }
              : input.sort === "due_date"
                ? { dueDate: input.direction }
                : { updatedAt: "desc" },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const results = rows.map((row) => ({
      id: row.id,
      title: row.title,
      projectId: row.project.id,
      projectName: row.project.name,
      status: row.status,
      priority: row.priority,
      dueDate: row.dueDate,
    }));

    if (input.sort === "priority") {
      results.sort((left, right) => {
        const completedDiff = completedRank(left.status) - completedRank(right.status);

        if (completedDiff !== 0) {
          return completedDiff;
        }

        const diff = priorityRank(left.priority) - priorityRank(right.priority);
        return input.direction === "asc" ? diff : -diff;
      });
    }

    return results;
  }
}
