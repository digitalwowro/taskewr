import {
  buildTaskDueReminderDedupeKey,
  TASK_DUE_REMINDER_NOTIFICATION_KIND,
  TASK_NOTIFICATION_STATUS,
  TaskNotificationsRepository,
} from "@/data/prisma/repositories/task-notifications-repository";
import { NotFoundError } from "@/domain/common/errors";
import { assertCanAccessTask } from "@/domain/auth/policies";
import { dateOnlyString, sameInstant, scheduledAtForDueReminder } from "@/domain/tasks/notification-schedule";
import { db } from "@/lib/db";
import { sendTaskDueReminderEmail } from "@/server/email/task-due-reminder";
import { AppContextService } from "@/server/services/app-context-service";
import { TasksRepository } from "@/data/prisma/repositories/tasks-repository";

const COMPLETED_TASK_STATUS = "done";
const MAX_ERROR_LENGTH = 2000;

type TaskDueReminderEmailSender = typeof sendTaskDueReminderEmail;

function toErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown notification delivery error.";
  return message.slice(0, MAX_ERROR_LENGTH);
}

export class TaskNotificationService {
  constructor(
    private readonly repository = new TaskNotificationsRepository(db),
    private readonly tasksRepository = new TasksRepository(db),
    private readonly contextService = new AppContextService(),
    private readonly emailSender: TaskDueReminderEmailSender = sendTaskDueReminderEmail,
  ) {}

  async subscribeCurrentUser(taskId: number) {
    const context = await this.contextService.getAppContext();
    const task = await this.tasksRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError("Task not found.", "task_not_found");
    }

    assertCanAccessTask(context, { projectId: task.projectId });
    await this.repository.subscribe(taskId, context.actorUserId);
    await this.syncTaskDueReminder(taskId);

    return { subscribed: true };
  }

  async unsubscribeCurrentUser(taskId: number) {
    const context = await this.contextService.getAppContext();
    const task = await this.tasksRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError("Task not found.", "task_not_found");
    }

    assertCanAccessTask(context, { projectId: task.projectId });
    await this.repository.unsubscribe(taskId, context.actorUserId);
    await this.repository.cancelOpenDueReminderDelivery(taskId, context.actorUserId);

    return { subscribed: false };
  }

  async subscribeTaskCreator(taskId: number, creatorUserId: number | null | undefined) {
    if (!creatorUserId) {
      return;
    }

    await this.repository.subscribe(taskId, creatorUserId);
  }

  async syncTaskDueReminder(taskId: number) {
    const task = await this.repository.findTaskForNotifications(taskId);

    if (!task) {
      return;
    }

    const activeSubscriptions = task.notificationSubscriptions.filter(
      (subscription) => subscription.user.deactivatedAt === null,
    );
    const activeUserIds = activeSubscriptions.map((subscription) => subscription.userId);

    await this.repository.cancelOpenDueReminderDeliveriesExcept(taskId, activeUserIds);

    if (
      task.status === COMPLETED_TASK_STATUS ||
      task.project.archivedAt !== null ||
      !task.dueDate ||
      !task.dueReminderTime ||
      activeSubscriptions.length === 0
    ) {
      await this.repository.cancelOpenDueReminderDeliveries(taskId);
      return;
    }

    for (const subscription of activeSubscriptions) {
      const scheduledAt = scheduledAtForDueReminder({
        dueDate: task.dueDate,
        dueReminderTime: task.dueReminderTime,
        timezone: subscription.user.timezone,
      });
      await this.upsertCurrentDueReminderDelivery({
        taskId,
        userId: subscription.userId,
        scheduledAt,
      });
    }
  }

  private async upsertCurrentDueReminderDelivery(input: {
    taskId: number;
    userId: number;
    scheduledAt: Date;
  }) {
    const dedupeKey = buildTaskDueReminderDedupeKey(input.taskId, input.userId);
    const existing = await this.repository.findDeliveryByDedupeKey(dedupeKey);

    if (!existing) {
      await this.repository.createDelivery({
        taskId: input.taskId,
        userId: input.userId,
        kind: TASK_DUE_REMINDER_NOTIFICATION_KIND,
        dedupeKey,
        scheduledAt: input.scheduledAt,
        status: TASK_NOTIFICATION_STATUS.pending,
      });
      return;
    }

    if (sameInstant(existing.scheduledAt, input.scheduledAt) && existing.status === TASK_NOTIFICATION_STATUS.sent) {
      return;
    }

    if (sameInstant(existing.scheduledAt, input.scheduledAt) && existing.status === TASK_NOTIFICATION_STATUS.failed) {
      return;
    }

    await this.repository.updateDelivery(existing.id, {
      scheduledAt: input.scheduledAt,
      status: TASK_NOTIFICATION_STATUS.pending,
      attempts: 0,
      claimedAt: null,
      sentAt: null,
      failedAt: null,
      lastError: null,
    });
  }

  async processDueReminderBatch(input: {
    now?: Date;
    batchSize: number;
    maxAttempts: number;
    claimTimeoutMs: number;
  }) {
    const now = input.now ?? new Date();
    const staleSendingBefore = new Date(now.getTime() - input.claimTimeoutMs);
    const deliveries = await this.repository.claimDueDeliveries({
      now,
      staleSendingBefore,
      batchSize: input.batchSize,
      maxAttempts: input.maxAttempts,
    });
    let sent = 0;
    let canceled = 0;
    let failed = 0;

    for (const delivery of deliveries) {
      const currentSchedule = this.getCurrentScheduleForDelivery(delivery);

      if (currentSchedule === null) {
        await this.repository.markDeliveryCanceled(delivery.id);
        canceled += 1;
        continue;
      }

      if (!sameInstant(currentSchedule, delivery.scheduledAt)) {
        await this.repository.updateDelivery(delivery.id, {
          scheduledAt: currentSchedule,
          status: TASK_NOTIFICATION_STATUS.pending,
          attempts: 0,
          claimedAt: null,
          sentAt: null,
          failedAt: null,
          lastError: null,
        });
        canceled += 1;
        continue;
      }

      const dueDate = delivery.task.dueDate;
      const dueReminderTime = delivery.task.dueReminderTime;

      if (!dueDate || !dueReminderTime) {
        await this.repository.markDeliveryCanceled(delivery.id);
        canceled += 1;
        continue;
      }

      try {
        await this.emailSender({
          to: delivery.user.email,
          name: delivery.user.name,
          taskId: delivery.taskId,
          taskTitle: delivery.task.title,
          projectName: delivery.task.project.name,
          dueDate,
          dueReminderTime,
          timezone: delivery.user.timezone,
        });
        await this.repository.markDeliverySent(delivery.id, now);
        sent += 1;
      } catch (error) {
        const message = toErrorMessage(error);

        if (delivery.attempts >= input.maxAttempts) {
          await this.repository.markDeliveryFailed(delivery.id, message, now);
          failed += 1;
        } else {
          await this.repository.markDeliveryPendingRetry(delivery.id, message);
        }
      }
    }

    return {
      claimed: deliveries.length,
      sent,
      canceled,
      failed,
    };
  }

  private getCurrentScheduleForDelivery(delivery: {
    userId: number;
    task: {
      status: string;
      dueDate: Date | null;
      dueReminderTime: string | null;
      project: {
        archivedAt: Date | null;
      };
      notificationSubscriptions: { userId: number }[];
    };
    user: {
      deactivatedAt: Date | null;
      timezone: string | null;
    };
  }) {
    if (
      delivery.task.status === COMPLETED_TASK_STATUS ||
      delivery.task.project.archivedAt !== null ||
      delivery.user.deactivatedAt !== null ||
      !delivery.task.dueDate ||
      !delivery.task.dueReminderTime
    ) {
      return null;
    }

    const isSubscribed = delivery.task.notificationSubscriptions.some(
      (subscription) => subscription.userId === delivery.userId,
    );

    if (!isSubscribed) {
      return null;
    }

    return scheduledAtForDueReminder({
      dueDate: delivery.task.dueDate,
      dueReminderTime: delivery.task.dueReminderTime,
      timezone: delivery.user.timezone,
    });
  }
}

export function describeTaskDueReminderDate(dueDate: Date, dueReminderTime: string) {
  return `${dateOnlyString(dueDate)} ${dueReminderTime}`;
}
