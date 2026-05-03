import { TasksRepository } from "@/data/prisma/repositories/tasks-repository";
import { RepeatRulesRepository } from "@/data/prisma/repositories/repeat-rules-repository";
import {
  assertCanAccessProject,
  assertCanAccessTask,
  requireWorkspaceOwnership,
} from "@/domain/auth/policies";
import { assertBoardMoveWithinProject, buildLaneOrderUpdates } from "@/domain/tasks/board";
import {
  assertCanMarkTaskDone,
  assertNoHierarchyCycle,
  assertSameProjectParent,
  assertTaskProjectChangeAllowed,
  assertTaskNotSelfParent,
} from "@/domain/tasks/hierarchy";
import { generateLabelColor, normalizeLabelNames } from "@/domain/tasks/labels";
import {
  boardMoveSchema,
  taskLinkMutationSchema,
  taskMutationSchema,
  type BoardMoveInput,
  type TaskLinkMutationInput,
  type TaskMutationInput,
} from "@/domain/tasks/schemas";
import { getNextRepeatDueDate } from "@/domain/tasks/repeat-schedule";
import type { RepeatSettingsInput } from "@/domain/tasks/repeat-schemas";
import { AuthorizationError, NotFoundError, ValidationError } from "@/domain/common/errors";
import { AppContextService } from "@/server/services/app-context-service";
import {
  TaskAttachmentStorage,
  type TaskAttachmentFileInput,
} from "@/server/services/task-attachment-storage";
import { TaskNotificationService } from "@/server/services/task-notification-service";
import { db } from "@/lib/db";

export class TaskService {
  constructor(
    private readonly repository = new TasksRepository(db),
    private readonly repeatRulesRepository = new RepeatRulesRepository(db),
    private readonly contextService = new AppContextService(),
    private readonly notificationService = new TaskNotificationService(),
    private readonly attachmentStorage = new TaskAttachmentStorage(),
  ) {}

  async getTask(id: number) {
    const context = await this.contextService.getAppContext();
    const task = await this.repository.findById(id);

    if (!task) {
      throw new NotFoundError("Task not found.", "task_not_found");
    }

    assertCanAccessTask(context, { projectId: task.projectId });

    return task;
  }

  async validateParentAssignment(input: {
    taskId: number | null;
    projectId: number;
    parentTaskId: number | null;
    nextStatus?: string;
  }) {
    assertTaskNotSelfParent(input.taskId, input.parentTaskId);

    const tasks = await this.repository.listTasksForHierarchy(input.projectId);
    const parentTask =
      input.parentTaskId === null
        ? null
        : await this.repository.findHierarchyTaskById(input.parentTaskId);

    if (input.parentTaskId !== null && parentTask === null) {
      throw new ValidationError("Parent task not found.", "task_parent_not_found");
    }

    assertSameProjectParent(input.projectId, parentTask?.projectId ?? null);
    assertNoHierarchyCycle(input.taskId, input.parentTaskId, tasks);

    if (input.taskId !== null && input.nextStatus === "done") {
      assertCanMarkTaskDone(input.taskId, tasks);
    }
  }

  private async assertCanUseProject(projectId: number, context: Awaited<ReturnType<AppContextService["getAppContext"]>>) {
    const project = await this.repository.findProjectById(projectId);

    if (!project) {
      throw new NotFoundError("Project not found.", "project_not_found");
    }

    assertCanAccessProject(context, { projectId: project.id });

    if (project.archivedAt !== null) {
      throw new ValidationError(
        "Archived projects cannot accept task changes.",
        "task_project_archived",
      );
    }

    return {
      id: project.id,
      workspaceId: requireWorkspaceOwnership(project.workspaceId),
    };
  }

  private async assertValidAssignee(projectId: number, assigneeUserId: number | null) {
    if (assigneeUserId === null) {
      return;
    }

    const projectMember = await this.repository.findActiveProjectMemberUser(projectId, assigneeUserId);

    if (!projectMember) {
      throw new ValidationError(
        "Assignee must be an active member of the selected project.",
        "task_assignee_invalid",
      );
    }
  }

  async planBoardMove(input: {
    taskId: number;
    projectId: number;
    nextStatus: string;
    targetLaneTaskIds: number[];
  }) {
    const task = await this.getTask(input.taskId);

    assertBoardMoveWithinProject(task.projectId, input.projectId);
    await this.assertLaneMoveIsScopedToProject(input);

    return {
      taskId: input.taskId,
      nextStatus: input.nextStatus,
      laneUpdates: buildLaneOrderUpdates(input.targetLaneTaskIds),
    };
  }

  private async assertLaneMoveIsScopedToProject(input: {
    taskId: number;
    projectId: number;
    nextStatus: string;
    targetLaneTaskIds: number[];
  }) {
    const uniqueTaskIds = [...new Set(input.targetLaneTaskIds)];

    if (uniqueTaskIds.length !== input.targetLaneTaskIds.length) {
      throw new ValidationError(
        "Board move contains duplicate lane tasks.",
        "task_board_duplicate_lane_task",
      );
    }

    if (!uniqueTaskIds.includes(input.taskId)) {
      throw new ValidationError(
        "Board move must include the moved task in the target lane.",
        "task_board_missing_moved_task",
      );
    }

    const laneTasks = await this.repository.listTasksByIds(uniqueTaskIds);

    if (laneTasks.length !== uniqueTaskIds.length) {
      throw new ValidationError(
        "Board move contains unknown lane tasks.",
        "task_board_unknown_lane_task",
      );
    }

    for (const laneTask of laneTasks) {
      if (laneTask.projectId !== input.projectId) {
        throw new ValidationError(
          "Board moves must stay within the same project.",
          "task_board_cross_project",
        );
      }

      if (laneTask.id !== input.taskId && laneTask.status !== input.nextStatus) {
        throw new ValidationError(
          "Board move lane tasks must match the target status.",
          "task_board_invalid_lane_status",
        );
      }
    }
  }

  async createTask(input: TaskMutationInput) {
    const payload = taskMutationSchema.parse(input);
    const context = await this.contextService.getAppContext();

    const targetProject = await this.assertCanUseProject(payload.projectId, context);
    await this.assertValidAssignee(payload.projectId, payload.assigneeUserId);

    await this.validateParentAssignment({
      taskId: null,
      projectId: payload.projectId,
      parentTaskId: payload.parentTaskId,
      nextStatus: payload.status,
    });

    const createdTask = await this.repository.create({
      projectId: payload.projectId,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
      title: payload.title,
      description: payload.description || null,
      parentTaskId: payload.parentTaskId,
      assigneeUserId: payload.assigneeUserId,
      status: payload.status,
      priority: payload.priority,
      startDate: payload.startDate ? new Date(payload.startDate) : null,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      dueReminderTime: payload.dueReminderTime,
    });

    await this.notificationService.subscribeTaskCreator(createdTask.id, context.actorUserId);
    await this.syncLabels(createdTask.id, payload.labels);
    await this.syncRepeatSettings(createdTask.id, payload, {
      workspaceId: targetProject.workspaceId,
      actorUserId: context.actorUserId,
    });
    await this.notificationService.syncTaskDueReminder(createdTask.id);
    return this.getTask(createdTask.id);
  }

  async updateTask(id: number, input: TaskMutationInput) {
    const payload = taskMutationSchema.parse(input);
    const context = await this.contextService.getAppContext();
    const currentTask = await this.getTask(id);

    const targetProject = await this.assertCanUseProject(payload.projectId, context);
    await this.assertValidAssignee(payload.projectId, payload.assigneeUserId);

    assertTaskProjectChangeAllowed({
      currentProjectId: currentTask.projectId,
      nextProjectId: payload.projectId,
      parentTaskId: currentTask.parentTaskId,
      childTaskCount: currentTask.childTasks.length,
    });

    await this.validateParentAssignment({
      taskId: id,
      projectId: payload.projectId,
      parentTaskId: payload.parentTaskId,
      nextStatus: payload.status,
    });

    const reminderTimeChanged =
      (currentTask.dueReminderTime ?? null) !== (payload.dueReminderTime ?? null);
    const actorSubscribedToTask = currentTask.notificationSubscriptions.some(
      (subscription) => subscription.userId === context.actorUserId,
    );

    if (reminderTimeChanged && !actorSubscribedToTask) {
      throw new AuthorizationError(
        "Subscribe to this task before changing reminder settings.",
        "task_reminder_subscription_required",
      );
    }

    await this.repository.updateById(id, {
      projectId: payload.projectId,
      updatedByUserId: context.actorUserId,
      title: payload.title,
      description: payload.description || null,
      parentTaskId: payload.parentTaskId,
      assigneeUserId: payload.assigneeUserId,
      status: payload.status,
      priority: payload.priority,
      startDate: payload.startDate ? new Date(payload.startDate) : null,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      dueReminderTime: payload.dueReminderTime,
      version: {
        increment: 1,
      },
    });

    await this.syncLabels(id, payload.labels);
    await this.syncRepeatSettings(id, payload, {
      workspaceId: targetProject.workspaceId,
      actorUserId: context.actorUserId,
    }, currentTask.repeatRuleId);

    await this.notificationService.syncTaskDueReminder(id);
    return this.getTask(id);
  }

  async completeTask(id: number) {
    const context = await this.contextService.getAppContext();
    const currentTask = await this.getTask(id);

    if (currentTask.status === "done") {
      return currentTask;
    }

    const hierarchyTasks = await this.repository.listTasksForHierarchy(currentTask.projectId);
    assertCanMarkTaskDone(id, hierarchyTasks);

    await this.repository.updateById(id, {
      updatedByUserId: context.actorUserId,
      status: "done",
      version: {
        increment: 1,
      },
    });

    await this.notificationService.syncTaskDueReminder(id);
    return this.getTask(id);
  }

  async reopenTask(id: number) {
    const context = await this.contextService.getAppContext();
    const currentTask = await this.getTask(id);

    if (currentTask.status !== "done") {
      return currentTask;
    }

    await this.repository.updateById(id, {
      updatedByUserId: context.actorUserId,
      status: "todo",
      version: {
        increment: 1,
      },
    });

    await this.notificationService.syncTaskDueReminder(id);
    return this.getTask(id);
  }

  async moveTaskOnBoard(input: BoardMoveInput) {
    const payload = boardMoveSchema.parse(input);
    const plan = await this.planBoardMove(payload);
    const currentTask = await this.getTask(payload.taskId);
    const sourceLaneTasks =
      currentTask.status === payload.nextStatus
        ? []
        : await this.repository.listLaneTasks(payload.projectId, currentTask.status);
    const sourceLaneUpdates = sourceLaneTasks
      .filter((task) => task.id !== payload.taskId)
      .map((task, index) => ({
        taskId: task.id,
        sortOrder: index + 1,
      }));

    await db.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: plan.taskId },
        data: {
          status: plan.nextStatus,
          sortOrder:
            plan.laneUpdates.find((update) => update.taskId === plan.taskId)?.sortOrder ?? 1,
          version: {
            increment: 1,
          },
        },
      });

      for (const laneUpdate of plan.laneUpdates) {
        if (laneUpdate.taskId === plan.taskId) {
          continue;
        }

        await tx.task.update({
          where: { id: laneUpdate.taskId },
          data: {
            sortOrder: laneUpdate.sortOrder,
          },
        });
      }

      for (const sourceLaneUpdate of sourceLaneUpdates) {
        await tx.task.update({
          where: { id: sourceLaneUpdate.taskId },
          data: {
            sortOrder: sourceLaneUpdate.sortOrder,
          },
        });
      }
    });

    await this.notificationService.syncTaskDueReminder(payload.taskId);
    return this.getTask(payload.taskId);
  }

  async createTaskLink(taskId: number, input: TaskLinkMutationInput) {
    const payload = taskLinkMutationSchema.parse(input);
    const context = await this.contextService.getAppContext();
    await this.getTask(taskId);

    return this.repository.createTaskLink({
      taskId,
      createdByUserId: context.actorUserId,
      title: payload.title,
      url: new URL(payload.url).href,
    });
  }

  async deleteTaskLink(taskId: number, linkId: number) {
    await this.getTask(taskId);
    const link = await this.repository.findTaskLink(taskId, linkId);

    if (!link) {
      throw new NotFoundError("Task link not found.", "task_link_not_found");
    }

    return this.repository.deleteTaskLink(taskId, linkId);
  }

  getAttachmentMaxBytes() {
    return this.attachmentStorage.maxBytes;
  }

  async createTaskAttachment(taskId: number, file: TaskAttachmentFileInput) {
    const context = await this.contextService.getAppContext();
    await this.getTask(taskId);

    const stored = await this.attachmentStorage.store(taskId, file);

    try {
      return await this.repository.createTaskAttachment({
        taskId,
        uploadedByUserId: context.actorUserId,
        originalFileName: stored.originalFileName,
        storageKey: stored.storageKey,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
      });
    } catch (error) {
      await this.attachmentStorage.delete(stored.storageKey).catch((deleteError) => {
        console.error("Failed to clean up task attachment after metadata write failure.", deleteError);
      });
      throw error;
    }
  }

  async getTaskAttachmentDownload(taskId: number, attachmentId: number) {
    await this.getTask(taskId);
    const attachment = await this.repository.findTaskAttachment(taskId, attachmentId);

    if (!attachment) {
      throw new NotFoundError("Task attachment not found.", "task_attachment_not_found");
    }

    const bytes = await this.attachmentStorage.read(attachment.storageKey);

    return {
      attachment,
      bytes,
    };
  }

  async deleteTaskAttachment(taskId: number, attachmentId: number) {
    await this.getTask(taskId);
    const attachment = await this.repository.findTaskAttachment(taskId, attachmentId);

    if (!attachment) {
      throw new NotFoundError("Task attachment not found.", "task_attachment_not_found");
    }

    const deleted = await this.repository.deleteTaskAttachment(taskId, attachmentId);

    await this.attachmentStorage.delete(attachment.storageKey).catch((error) => {
      console.error("Failed to delete task attachment file after metadata deletion.", error);
    });

    return deleted;
  }

  private async syncLabels(taskId: number, labelNames: string[]) {
    const normalizedNames = normalizeLabelNames(labelNames);

    if (normalizedNames.length === 0) {
      await this.repository.replaceTaskLabels(taskId, []);
      return;
    }

    const existingLabels = await this.repository.findLabelsByNames(normalizedNames);
    const byName = new Map(existingLabels.map((label) => [label.name, label]));

    for (const name of normalizedNames) {
      if (byName.has(name)) {
        continue;
      }

      const label = await this.repository.upsertLabel({
        workspaceId: null,
        ownerUserId: null,
        name,
        color: generateLabelColor(name),
      });

      byName.set(name, label);
    }

    await this.repository.replaceTaskLabels(
      taskId,
      normalizedNames.map((name) => byName.get(name)!.id),
    );
  }

  private async syncRepeatSettings(
    taskId: number,
    payload: TaskMutationInput,
    context: { workspaceId: number; actorUserId: number | null },
    existingRepeatRuleId?: number | null,
  ) {
    if (!payload.repeat.enabled) {
      if (existingRepeatRuleId) {
        await this.repeatRulesRepository.deactivateById(existingRepeatRuleId);
      } else {
        await this.repeatRulesRepository.deactivateForSourceTask(taskId);
      }
      await this.repository.updateById(taskId, {
        repeatRuleId: null,
        repeatScheduledFor: null,
        repeatPeriodStart: null,
        repeatPeriodEnd: null,
        repeatSequence: null,
        repeatCarryCount: 0,
      });
      return;
    }

    const firstDueDate = payload.dueDate ?? payload.startDate ?? new Date().toISOString().slice(0, 10);
    const nextDueDate = getNextRepeatDueDate(
      toRepeatSchedule(payload.repeat),
      firstDueDate,
      firstDueDate,
    );
    const ruleData = {
      workspaceId: context.workspaceId,
      projectId: payload.projectId,
      isActive: true,
      scheduleType: payload.repeat.scheduleType,
      interval: payload.repeat.interval,
      weekdays: payload.repeat.weekdays,
      monthDay: payload.repeat.monthDay,
      specificDates: payload.repeat.specificDates,
      incompleteBehavior: payload.repeat.incompleteBehavior,
      nextDueDate: nextDueDate ? new Date(`${nextDueDate}T00:00:00.000Z`) : null,
    };
    const rule = existingRepeatRuleId
      ? await this.repeatRulesRepository.updateRule(existingRepeatRuleId, {
          ...ruleData,
          sourceTaskId: taskId,
        })
      : await this.repeatRulesRepository.upsertForSourceTask({
          sourceTaskId: taskId,
          data: ruleData,
        });
    const scheduledFor = new Date(`${firstDueDate}T00:00:00.000Z`);

    await this.repository.updateById(taskId, {
      repeatRuleId: rule.id,
      repeatScheduledFor: scheduledFor,
      repeatPeriodStart: scheduledFor,
      repeatPeriodEnd: scheduledFor,
      repeatSequence: 1,
    });
  }
}

function toRepeatSchedule(repeat: RepeatSettingsInput) {
  return {
    scheduleType: repeat.scheduleType,
    interval: repeat.interval,
    weekdays: repeat.weekdays,
    monthDay: repeat.monthDay,
    specificDates: repeat.specificDates,
  };
}
