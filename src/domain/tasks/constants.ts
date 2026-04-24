export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "done",
  "canceled",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const DEFAULT_TASK_STATUSES: TaskStatus[] = ["todo", "in_progress"];
export const DEFAULT_TASK_PRIORITIES: TaskPriority[] = [];
export const DEFAULT_TASK_SORT = "priority" as const;
export const DEFAULT_TASK_DIRECTION = "desc" as const;
export const DEFAULT_DASHBOARD_STATUSES: TaskStatus[] = DEFAULT_TASK_STATUSES;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In Progress",
  done: "Completed",
  canceled: "Canceled",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const TASK_SORT_OPTIONS = [
  "priority",
  "status",
  "created_at",
  "updated_at",
  "start_date",
  "due_date",
] as const;

export type TaskSortOption = (typeof TASK_SORT_OPTIONS)[number];

export const TASK_SORT_DIRECTIONS = ["asc", "desc"] as const;

export type TaskSortDirection = (typeof TASK_SORT_DIRECTIONS)[number];

export const TASK_SORT_OPTION_LABELS: Record<TaskSortOption, string> = {
  priority: "Priority",
  status: "Status",
  created_at: "Last created",
  updated_at: "Last updated",
  start_date: "Start date",
  due_date: "Due date",
};

export const SORT_OPTIONS: { value: TaskSortOption; label: string }[] = TASK_SORT_OPTIONS.map(
  (value) => ({
    value,
    label: TASK_SORT_OPTION_LABELS[value],
  }),
);

export const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = TASK_STATUSES.map(
  (value) => ({
    value,
    label: TASK_STATUS_LABELS[value],
  }),
);

export const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = TASK_PRIORITIES.map(
  (value) => ({
    value,
    label: TASK_PRIORITY_LABELS[value],
  }),
);

export const TASK_PRIORITY_RANK: Record<TaskPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

export const TASK_STATUS_RANK: Record<TaskStatus, number> = {
  canceled: 0,
  backlog: 1,
  todo: 2,
  in_progress: 3,
  done: 4,
};
