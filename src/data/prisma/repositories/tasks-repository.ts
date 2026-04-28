import type { Prisma } from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";

export class TasksRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: number) {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        parentTask: true,
        repeatRule: true,
        childTasks: true,
        taskLabels: {
          include: {
            label: true,
          },
        },
      },
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
      include: {
        project: true,
        childTasks: true,
        repeatRule: true,
        taskLabels: {
          include: {
            label: true,
          },
        },
      },
    });
  }

  listWorkspaceTasks(workspaceId: number) {
    return this.prisma.task.findMany({
      where: {
        project: {
          workspaceId,
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        project: true,
        parentTask: true,
        repeatRule: true,
        taskLabels: {
          include: {
            label: true,
          },
        },
      },
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
      include: {
       project: true,
        parentTask: true,
        repeatRule: true,
        childTasks: true,
        taskLabels: {
          include: {
            label: true,
          },
        },
      },
    });
  }

  updateById(id: number, data: Prisma.TaskUncheckedUpdateInput) {
    return this.prisma.task.update({
      where: { id },
      data,
      include: {
        project: true,
        parentTask: true,
        repeatRule: true,
        childTasks: true,
        taskLabels: {
          include: {
            label: true,
          },
        },
      },
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
