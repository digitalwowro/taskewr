import {
  DEFAULT_TASK_DIRECTION,
  DEFAULT_TASK_PRIORITIES,
  DEFAULT_TASK_SORT,
  DEFAULT_TASK_STATUSES,
  PRIORITY_OPTIONS,
  SORT_OPTIONS,
  type TaskPriority,
  type TaskSortDirection,
  type TaskSortOption,
  type TaskStatus,
  STATUS_OPTIONS,
} from "@/domain/tasks/constants";
import type { TaskFilters } from "@/domain/tasks/types";
import { PROJECT_VIEWS, type ProjectView } from "@/domain/projects/constants";

export const DEFAULT_TASK_FILTERS: TaskFilters = {
  sort: DEFAULT_TASK_SORT,
  direction: DEFAULT_TASK_DIRECTION,
  status: DEFAULT_TASK_STATUSES,
  priority: DEFAULT_TASK_PRIORITIES,
  startDate: null,
  endDate: null,
};

export function normalizeTaskStatuses(statuses: TaskStatus[] | undefined): TaskStatus[] {
  return statuses ? [...statuses] : [...DEFAULT_TASK_STATUSES];
}

export function normalizeTaskPriorities(
  priorities: TaskPriority[] | undefined,
): TaskPriority[] {
  return priorities && priorities.length > 0 ? [...priorities] : [...DEFAULT_TASK_PRIORITIES];
}

export function normalizeTaskFilters(input?: Partial<TaskFilters>): TaskFilters {
  return {
    sort: (input?.sort ?? DEFAULT_TASK_SORT) as TaskSortOption,
    direction: (input?.direction ?? DEFAULT_TASK_DIRECTION) as TaskSortDirection,
    status: normalizeTaskStatuses(input?.status),
    priority: normalizeTaskPriorities(input?.priority),
    startDate: input?.startDate ?? null,
    endDate: input?.endDate ?? null,
  };
}

type SearchParamsLike = Record<string, string | string[] | undefined>;

function toValues(value: string | string[] | undefined) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : value.split(",");
}

export function parseTaskFiltersFromSearchParams(searchParams?: SearchParamsLike): TaskFilters {
  const sort = toValues(searchParams?.sort)[0];
  const direction = toValues(searchParams?.direction)[0];
  const startDate = toValues(searchParams?.startDate)[0] ?? null;
  const endDate = toValues(searchParams?.endDate)[0] ?? null;
  const rawStatuses = toValues(searchParams?.status);
  const statuses =
    rawStatuses[0] === "all"
      ? []
      : rawStatuses.filter((value): value is TaskStatus =>
    STATUS_OPTIONS.some((option) => option.value === value),
        );
  const priorities = toValues(searchParams?.priority).filter((value): value is TaskPriority =>
    PRIORITY_OPTIONS.some((option) => option.value === value),
  );

  return normalizeTaskFilters({
    sort: SORT_OPTIONS.some((option) => option.value === sort)
      ? (sort as TaskSortOption)
      : DEFAULT_TASK_SORT,
    direction: direction === "asc" || direction === "desc" ? direction : DEFAULT_TASK_DIRECTION,
    status: statuses,
    priority: priorities,
    startDate,
    endDate,
  });
}

export function buildTaskFilterSearchParams(filters: TaskFilters) {
  const params = new URLSearchParams();

  params.set("sort", filters.sort);
  params.set("direction", filters.direction);
  params.set("status", filters.status.length > 0 ? filters.status.join(",") : "all");

  if (filters.priority.length > 0) {
    params.set("priority", filters.priority.join(","));
  }

  if (filters.startDate) {
    params.set("startDate", filters.startDate);
  }

  if (filters.endDate) {
    params.set("endDate", filters.endDate);
  }

  return params;
}

export function parseProjectViewFromSearchParams(
  searchParams?: SearchParamsLike,
): ProjectView {
  const value = toValues(searchParams?.view)[0];
  return PROJECT_VIEWS.includes(value as ProjectView) ? (value as ProjectView) : "list";
}
