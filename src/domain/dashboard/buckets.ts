import type { TaskListItem } from "@/domain/tasks/types";
import { getRelativeDayOffset } from "@/lib/time/dashboard-dates";

export type DashboardTaskBuckets = {
  recurringOverdueItems: TaskListItem[];
  recurringTodayItems: TaskListItem[];
  focusOverdueItems: TaskListItem[];
  focusTodayItems: TaskListItem[];
  projectItems: TaskListItem[];
};

function getTaskDayOffset(task: { dueDate: string | null }, referenceDate: Date, timezone: string | null) {
  return getRelativeDayOffset(
    task.dueDate ? new Date(task.dueDate) : null,
    referenceDate,
    timezone,
  );
}

export function isDashboardRelevantTask(
  task: { dueDate: string | null },
  referenceDate = new Date(),
  timezone: string | null = null,
) {
  const offset = getTaskDayOffset(task, referenceDate, timezone);
  return offset === null || offset <= 0;
}

export function isTodayOrUnscheduledTask(
  task: { dueDate: string | null },
  referenceDate = new Date(),
  timezone: string | null = null,
) {
  const offset = getTaskDayOffset(task, referenceDate, timezone);
  return offset === null || offset === 0;
}

export function bucketDashboardTasks(
  tasks: TaskListItem[],
  referenceDate = new Date(),
  timezone: string | null = null,
): DashboardTaskBuckets {
  const buckets: DashboardTaskBuckets = {
    recurringOverdueItems: [],
    recurringTodayItems: [],
    focusOverdueItems: [],
    focusTodayItems: [],
    projectItems: [],
  };

  for (const task of tasks) {
    if (!isDashboardRelevantTask(task, referenceDate, timezone)) {
      continue;
    }

    buckets.projectItems.push(task);

    const offset = getTaskDayOffset(task, referenceDate, timezone);
    const isRecurring = Boolean(task.repeatRuleId);

    if (isRecurring && offset !== null && offset < 0) {
      buckets.recurringOverdueItems.push(task);
      continue;
    }

    if (isRecurring) {
      buckets.recurringTodayItems.push(task);
      continue;
    }

    if (offset !== null && offset < 0) {
      buckets.focusOverdueItems.push(task);
      continue;
    }

    buckets.focusTodayItems.push(task);
  }

  return buckets;
}

