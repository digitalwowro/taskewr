import type { Prisma } from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";

export class TasksRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private readonly taskInclude = {
    project: {
      include: {
        workspace: true,
      },
    },
    parentTask: true,
    repeatRule: true,
    childTasks: true,
    taskLabels: {
      include: {
        label: true,
      },
    },
  } as const;

  private readonly taskListInclude = {
    project: {
      include: {
        workspace: true,
      },
    },
    parentTask: true,
    repeatRule: true,
    taskLabels: {
      include: {
        label: true,
      },
    },
  } as const;

  findById(id: number) {
    return this.prisma.task.findUnique({
      where: { id },
      include: this.taskInclude,
    });
  }

  findProjectById(id: number) {
    return this.prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        workspaceId: true,
        archivedAt: true,
      },
    });
  }

  listProjectTasks(projectId: number, includeArchivedProject = false) {
    return this.prisma.task.findMany({
      where: {
        projectId,
        ...(includeArchivedProject
          ? {}
          : {
              project: {
                archivedAt: null,
              },
            }),
      },
      orderBy: [{ status: "asc" }, { sortOrder: "asc" }],
      include: this.taskInclude,
    });
  }

  listTasksForProjects(projectIds: number[]) {
    if (projectIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.task.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      include: this.taskListInclude,
    });
  }

  listTasksForHierarchy(projectId: number) {
    return this.prisma.task.findMany({
      where: { projectId },
      select: {
        id: true,
        projectId: true,
        parentTaskId: true,
        status: true,
      },
    });
  }

  findHierarchyTaskById(id: number) {
    return this.prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        parentTaskId: true,
        status: true,
      },
    });
  }

  listTasksByIds(ids: number[]) {
    return this.prisma.task.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        projectId: true,
        status: true,
      },
    });
  }

  updateMany(args: Prisma.TaskUpdateManyArgs) {
    return this.prisma.task.updateMany(args);
  }

  create(data: Prisma.TaskUncheckedCreateInput) {
    return this.prisma.task.create({
      data,
      include: this.taskInclude,
    });
  }

  updateById(id: number, data: Prisma.TaskUncheckedUpdateInput) {
    return this.prisma.task.update({
      where: { id },
      data,
      include: this.taskInclude,
    });
  }

  listLaneTasks(projectId: number, status: string) {
    return this.prisma.task.findMany({
      where: {
        projectId,
        status,
      },
      orderBy: [{ sortOrder: "asc" }],
      select: {
        id: true,
        sortOrder: true,
      },
    });
  }

  findLabelsByNames(ownerUserId: number | null, names: string[]) {
    return this.prisma.label.findMany({
      where: {
        ownerUserId,
        name: {
          in: names,
        },
      },
    });
  }

  createLabel(data: Prisma.LabelUncheckedCreateInput) {
    return this.prisma.label.create({
      data,
    });
  }

  replaceTaskLabels(taskId: number, labelIds: number[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.taskLabel.deleteMany({
        where: { taskId },
      });

      if (labelIds.length > 0) {
        await tx.taskLabel.createMany({
          data: labelIds.map((labelId) => ({
            taskId,
            labelId,
          })),
        });
      }
    });
  }
}
