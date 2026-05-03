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
    creator: {
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    },
    assignee: {
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    },
    repeatRule: true,
    childTasks: true,
    taskLabels: {
      include: {
        label: true,
      },
    },
    links: {
      orderBy: {
        createdAt: "desc",
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    },
    attachments: {
      orderBy: {
        createdAt: "desc",
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    },
    timeEntries: {
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    },
    notificationSubscriptions: {
      select: {
        userId: true,
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
    creator: {
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    },
    assignee: {
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    },
    repeatRule: true,
    taskLabels: {
      include: {
        label: true,
      },
    },
    links: {
      orderBy: {
        createdAt: "desc",
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    },
    attachments: {
      orderBy: {
        createdAt: "desc",
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    },
    timeEntries: {
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    },
    notificationSubscriptions: {
      select: {
        userId: true,
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

  findActiveProjectMemberUser(projectId: number, userId: number) {
    return this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
        user: {
          deactivatedAt: null,
        },
      },
      select: {
        userId: true,
        role: true,
      },
    });
  }

  findProjectMemberUser(projectId: number, userId: number) {
    return this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
      select: {
        userId: true,
        role: true,
        user: {
          select: {
            deactivatedAt: true,
          },
        },
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

  listLabels() {
    return this.prisma.label.findMany({
      orderBy: { name: "asc" },
      select: {
        name: true,
      },
    });
  }

  findLabelsByNames(names: string[]) {
    return this.prisma.label.findMany({
      where: {
        name: {
          in: names,
        },
      },
    });
  }

  upsertLabel(data: Prisma.LabelUncheckedCreateInput) {
    return this.prisma.label.upsert({
      where: { name: data.name },
      update: {},
      create: data,
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

  createTaskLink(data: Prisma.TaskLinkUncheckedCreateInput) {
    return this.prisma.taskLink.create({
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  findTaskLink(taskId: number, linkId: number) {
    return this.prisma.taskLink.findFirst({
      where: {
        id: linkId,
        taskId,
      },
    });
  }

  deleteTaskLink(_taskId: number, linkId: number) {
    return this.prisma.taskLink.delete({
      where: {
        id: linkId,
      },
    });
  }

  createTaskAttachment(data: Prisma.TaskAttachmentUncheckedCreateInput) {
    return this.prisma.taskAttachment.create({
      data,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  findTaskAttachment(taskId: number, attachmentId: number) {
    return this.prisma.taskAttachment.findFirst({
      where: {
        id: attachmentId,
        taskId,
      },
    });
  }

  deleteTaskAttachment(_taskId: number, attachmentId: number) {
    return this.prisma.taskAttachment.delete({
      where: {
        id: attachmentId,
      },
    });
  }

  createTaskTimeEntry(data: Prisma.TaskTimeEntryUncheckedCreateInput) {
    return this.prisma.taskTimeEntry.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  findTaskTimeEntry(taskId: number, entryId: number) {
    return this.prisma.taskTimeEntry.findFirst({
      where: {
        id: entryId,
        taskId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  deleteTaskTimeEntry(_taskId: number, entryId: number) {
    return this.prisma.taskTimeEntry.delete({
      where: {
        id: entryId,
      },
    });
  }
}
