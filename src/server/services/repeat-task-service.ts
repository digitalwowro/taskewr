import type { Prisma } from "@/generated/prisma/client";
import { RepeatRulesRepository } from "@/data/prisma/repositories/repeat-rules-repository";
import {
  getNextRepeatDueDate,
  getRepeatDueDatesThrough,
  type RepeatSchedule,
} from "@/domain/tasks/repeat-schedule";
import type { RepeatIncompleteBehavior, RepeatScheduleType } from "@/domain/tasks/repeat-schemas";
import { db } from "@/lib/db";

type RepeatRuleRecord = Awaited<ReturnType<RepeatRulesRepository["listDueRules"]>>[number];
type RepeatRulesStore = Pick<
  RepeatRulesRepository,
  | "listDueRules"
  | "updateRule"
  | "findTaskForOccurrence"
  | "findOpenTaskForRule"
  | "createTask"
  | "updateTask"
  | "replaceTaskLabels"
>;

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function fromDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function toNumberArray(value: Prisma.JsonValue | null) {
  return Array.isArray(value)
    ? value.filter((item): item is number => Number.isInteger(item))
    : [];
}

function toStringArray(value: Prisma.JsonValue | null) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function toSchedule(rule: RepeatRuleRecord): RepeatSchedule {
  return {
    scheduleType: rule.scheduleType as RepeatScheduleType,
    interval: rule.interval,
    weekdays: toNumberArray(rule.weekdays),
    monthDay: rule.monthDay,
    specificDates: toStringArray(rule.specificDates),
  };
}

function getRuleStartDate(rule: RepeatRuleRecord, today: string) {
  return toDateOnly(
    rule.nextDueDate ??
      rule.sourceTask?.dueDate ??
      rule.sourceTask?.startDate ??
      rule.sourceTask?.createdAt ??
      fromDateOnly(today),
  );
}

function isCreateSeparate(value: string): value is RepeatIncompleteBehavior {
  return value === "create_separate";
}

export class RepeatTaskService {
  constructor(private readonly repository: RepeatRulesStore = new RepeatRulesRepository(db)) {}

  async syncDueTasks(workspaceId: number, now = new Date()) {
    const today = toDateOnly(now);
    const rules = await this.repository.listDueRules(workspaceId, fromDateOnly(today));

    for (const rule of rules) {
      await this.syncRule(rule, today);
    }
  }

  private async syncRule(rule: RepeatRuleRecord, today: string) {
    if (!rule.sourceTask) {
      await this.repository.updateRule(rule.id, {
        isActive: false,
        lastSyncedAt: new Date(),
      });
      return;
    }

    const schedule = toSchedule(rule);
    const startDate = getRuleStartDate(rule, today);
    const dueDates = getRepeatDueDatesThrough(schedule, startDate, today);

    if (dueDates.length === 0) {
      return;
    }

    for (const [index, dueDate] of dueDates.entries()) {
      if (isCreateSeparate(rule.incompleteBehavior)) {
        await this.createSeparateTask(rule, dueDate, index + 1);
      } else {
        await this.carryForwardTask(rule, dueDate, index + 1);
      }
    }

    await this.repository.updateRule(rule.id, {
      nextDueDate: getNextRepeatDueDate(schedule, startDate, dueDates[dueDates.length - 1]),
      lastSyncedAt: new Date(),
    });
  }

  private async createSeparateTask(rule: RepeatRuleRecord, dueDate: string, sequence: number) {
    const scheduledFor = fromDateOnly(dueDate);
    const existing = await this.repository.findTaskForOccurrence(rule.id, scheduledFor);

    if (existing) {
      return;
    }

    const task = await this.createTaskFromRule(rule, dueDate, sequence);
    await this.copyLabels(rule, task.id);
  }

  private async carryForwardTask(rule: RepeatRuleRecord, dueDate: string, sequence: number) {
    const scheduledFor = fromDateOnly(dueDate);
    const existingOccurrence = await this.repository.findTaskForOccurrence(rule.id, scheduledFor);

    if (existingOccurrence) {
      return;
    }

    const openTask = await this.repository.findOpenTaskForRule(rule.id);

    if (openTask) {
      await this.repository.updateTask(openTask.id, {
        dueDate: scheduledFor,
        repeatScheduledFor: scheduledFor,
        repeatPeriodStart: scheduledFor,
        repeatPeriodEnd: scheduledFor,
        repeatSequence: sequence,
        repeatCarryCount: {
          increment: 1,
        },
        version: {
          increment: 1,
        },
      });
      return;
    }

    const task = await this.createTaskFromRule(rule, dueDate, sequence);
    await this.copyLabels(rule, task.id);
  }

  private createTaskFromRule(rule: RepeatRuleRecord, dueDate: string, sequence: number) {
    const scheduledFor = fromDateOnly(dueDate);

    return this.repository.createTask({
      projectId: rule.projectId,
      createdByUserId: rule.sourceTask?.createdByUserId ?? undefined,
      updatedByUserId: rule.sourceTask?.updatedByUserId ?? rule.sourceTask?.createdByUserId ?? undefined,
      title: rule.sourceTask?.title ?? "Repeated task",
      description: rule.sourceTask?.description ?? null,
      parentTaskId: null,
      status: "todo",
      priority: rule.sourceTask?.priority ?? "medium",
      startDate: scheduledFor,
      dueDate: scheduledFor,
      repeatRuleId: rule.id,
      repeatScheduledFor: scheduledFor,
      repeatPeriodStart: scheduledFor,
      repeatPeriodEnd: scheduledFor,
      repeatSequence: sequence,
    });
  }

  private async copyLabels(rule: RepeatRuleRecord, taskId: number) {
    const labelIds = rule.sourceTask?.taskLabels.map((item) => item.labelId) ?? [];
    await this.repository.replaceTaskLabels(taskId, labelIds);
  }
}

