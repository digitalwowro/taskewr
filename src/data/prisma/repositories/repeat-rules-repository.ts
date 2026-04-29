import type { Prisma, PrismaClient } from "@/generated/prisma/client";

const OPEN_TASK_STATUSES = ["backlog", "todo", "in_progress"];

export class RepeatRulesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listDueRules(workspaceId: number, throughDate: Date) {
    return this.listDueRulesWhere(
      {
        project: {
          workspaceId,
          archivedAt: null,
        },
      },
      throughDate,
    );
  }

  listDueRulesForProjects(projectIds: number[], throughDate: Date) {
    if (projectIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.listDueRulesWhere(
      {
        projectId: {
          in: projectIds,
        },
        project: {
          archivedAt: null,
        },
      },
      throughDate,
    );
  }

  private listDueRulesWhere(where: Prisma.TaskRepeatRuleWhereInput, throughDate: Date) {
    return this.prisma.taskRepeatRule.findMany({
      where: {
        ...where,
        isActive: true,
        OR: [
          { nextDueDate: null },
          {
            nextDueDate: {
              lte: throughDate,
            },
          },
        ],
      },
      include: {
        sourceTask: {
          include: {
            taskLabels: {
              include: {
                label: true,
              },
            },
          },
        },
        tasks: {
          where: {
            status: {
              in: OPEN_TASK_STATUSES,
            },
          },
          orderBy: {
            repeatScheduledFor: "desc",
          },
        },
      },
    });
  }

  findBySourceTaskId(sourceTaskId: number) {
    return this.prisma.taskRepeatRule.findUnique({
      where: { sourceTaskId },
    });
  }

  upsertForSourceTask({
    sourceTaskId,
    data,
  }: {
    sourceTaskId: number;
    data: Omit<Prisma.TaskRepeatRuleUncheckedCreateInput, "sourceTaskId">;
  }) {
    return this.prisma.taskRepeatRule.upsert({
      where: { sourceTaskId },
      create: {
        ...data,
        sourceTaskId,
      },
      update: data,
    });
  }

  deactivateForSourceTask(sourceTaskId: number) {
    return this.prisma.taskRepeatRule.updateMany({
      where: { sourceTaskId },
      data: {
        isActive: false,
      },
    });
  }

  deactivateById(id: number) {
    return this.prisma.taskRepeatRule.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  updateRule(id: number, data: Prisma.TaskRepeatRuleUncheckedUpdateInput) {
    return this.prisma.taskRepeatRule.update({
      where: { id },
      data,
    });
  }

  findTaskForOccurrence(repeatRuleId: number, scheduledFor: Date) {
    return this.prisma.task.findFirst({
      where: {
        repeatRuleId,
        repeatScheduledFor: scheduledFor,
      },
    });
  }

  findOpenTaskForRule(repeatRuleId: number) {
    return this.prisma.task.findFirst({
      where: {
        repeatRuleId,
        status: {
          in: OPEN_TASK_STATUSES,
        },
      },
      orderBy: {
        repeatScheduledFor: "desc",
      },
    });
  }

  createTask(data: Prisma.TaskUncheckedCreateInput) {
    return this.prisma.task.create({ data });
  }

  updateTask(id: number, data: Prisma.TaskUncheckedUpdateInput) {
    return this.prisma.task.update({
      where: { id },
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
          skipDuplicates: true,
        });
      }
    });
  }
}
