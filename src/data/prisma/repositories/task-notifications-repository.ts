import type { Prisma, PrismaClient } from "@/generated/prisma/client";

export const TASK_DUE_REMINDER_NOTIFICATION_KIND = "due_reminder";
export const TASK_NOTIFICATION_STATUS = {
  pending: "pending",
  sending: "sending",
  sent: "sent",
  failed: "failed",
  canceled: "canceled",
} as const;

export type TaskNotificationStatus =
  (typeof TASK_NOTIFICATION_STATUS)[keyof typeof TASK_NOTIFICATION_STATUS];

const OPEN_DELIVERY_STATUSES = [
  TASK_NOTIFICATION_STATUS.pending,
  TASK_NOTIFICATION_STATUS.sending,
  TASK_NOTIFICATION_STATUS.failed,
];

export function buildTaskDueReminderDedupeKey(taskId: number, userId: number) {
  return `task:${taskId}:user:${userId}:due_reminder`;
}

export class TaskNotificationsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private readonly taskNotificationInclude = {
    project: true,
    notificationSubscriptions: {
      include: {
        user: true,
      },
    },
  } as const;

  private readonly deliveryInclude = {
    task: {
      include: {
        project: true,
        notificationSubscriptions: true,
      },
    },
    user: true,
  } as const;

  findTaskForNotifications(taskId: number) {
    return this.prisma.task.findUnique({
      where: { id: taskId },
      include: this.taskNotificationInclude,
    });
  }

  findDeliveryByDedupeKey(dedupeKey: string) {
    return this.prisma.taskNotificationDelivery.findUnique({
      where: { dedupeKey },
    });
  }

  createDelivery(data: Prisma.TaskNotificationDeliveryUncheckedCreateInput) {
    return this.prisma.taskNotificationDelivery.create({ data });
  }

  updateDelivery(id: number, data: Prisma.TaskNotificationDeliveryUncheckedUpdateInput) {
    return this.prisma.taskNotificationDelivery.update({
      where: { id },
      data,
    });
  }

  cancelOpenDueReminderDeliveries(taskId: number) {
    return this.prisma.taskNotificationDelivery.updateMany({
      where: {
        taskId,
        kind: TASK_DUE_REMINDER_NOTIFICATION_KIND,
        status: {
          in: OPEN_DELIVERY_STATUSES,
        },
      },
      data: {
        status: TASK_NOTIFICATION_STATUS.canceled,
        claimedAt: null,
      },
    });
  }

  cancelOpenDueReminderDelivery(taskId: number, userId: number) {
    return this.prisma.taskNotificationDelivery.updateMany({
      where: {
        taskId,
        userId,
        kind: TASK_DUE_REMINDER_NOTIFICATION_KIND,
        status: {
          in: OPEN_DELIVERY_STATUSES,
        },
      },
      data: {
        status: TASK_NOTIFICATION_STATUS.canceled,
        claimedAt: null,
      },
    });
  }

  cancelOpenDueReminderDeliveriesExcept(taskId: number, userIds: number[]) {
    return this.prisma.taskNotificationDelivery.updateMany({
      where: {
        taskId,
        kind: TASK_DUE_REMINDER_NOTIFICATION_KIND,
        status: {
          in: OPEN_DELIVERY_STATUSES,
        },
        userId: {
          notIn: userIds,
        },
      },
      data: {
        status: TASK_NOTIFICATION_STATUS.canceled,
        claimedAt: null,
      },
    });
  }

  subscribe(taskId: number, userId: number) {
    return this.prisma.taskNotificationSubscription.upsert({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
      create: {
        taskId,
        userId,
      },
      update: {},
    });
  }

  unsubscribe(taskId: number, userId: number) {
    return this.prisma.taskNotificationSubscription.deleteMany({
      where: {
        taskId,
        userId,
      },
    });
  }

  claimDueDeliveries(input: {
    now: Date;
    staleSendingBefore: Date;
    batchSize: number;
    maxAttempts: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const candidates = await tx.taskNotificationDelivery.findMany({
        where: {
          kind: TASK_DUE_REMINDER_NOTIFICATION_KIND,
          scheduledAt: {
            lte: input.now,
          },
          attempts: {
            lt: input.maxAttempts,
          },
          OR: [
            {
              status: TASK_NOTIFICATION_STATUS.pending,
            },
            {
              status: TASK_NOTIFICATION_STATUS.sending,
              claimedAt: {
                lte: input.staleSendingBefore,
              },
            },
          ],
        },
        orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
        take: input.batchSize,
        select: {
          id: true,
        },
      });

      const claimedIds: number[] = [];

      for (const candidate of candidates) {
        const result = await tx.taskNotificationDelivery.updateMany({
          where: {
            id: candidate.id,
            scheduledAt: {
              lte: input.now,
            },
            attempts: {
              lt: input.maxAttempts,
            },
            OR: [
              {
                status: TASK_NOTIFICATION_STATUS.pending,
              },
              {
                status: TASK_NOTIFICATION_STATUS.sending,
                claimedAt: {
                  lte: input.staleSendingBefore,
                },
              },
            ],
          },
          data: {
            status: TASK_NOTIFICATION_STATUS.sending,
            claimedAt: input.now,
            attempts: {
              increment: 1,
            },
          },
        });

        if (result.count === 1) {
          claimedIds.push(candidate.id);
        }
      }

      if (claimedIds.length === 0) {
        return [];
      }

      return tx.taskNotificationDelivery.findMany({
        where: {
          id: {
            in: claimedIds,
          },
        },
        include: this.deliveryInclude,
      });
    });
  }

  markDeliverySent(id: number, sentAt: Date) {
    return this.updateDelivery(id, {
      status: TASK_NOTIFICATION_STATUS.sent,
      sentAt,
      failedAt: null,
      claimedAt: null,
      lastError: null,
    });
  }

  markDeliveryPendingRetry(id: number, error: string) {
    return this.updateDelivery(id, {
      status: TASK_NOTIFICATION_STATUS.pending,
      claimedAt: null,
      lastError: error,
    });
  }

  markDeliveryFailed(id: number, error: string, failedAt: Date) {
    return this.updateDelivery(id, {
      status: TASK_NOTIFICATION_STATUS.failed,
      failedAt,
      claimedAt: null,
      lastError: error,
    });
  }

  markDeliveryCanceled(id: number) {
    return this.updateDelivery(id, {
      status: TASK_NOTIFICATION_STATUS.canceled,
      claimedAt: null,
    });
  }
}
