import type { ProjectView } from "@/domain/projects/constants";
import { buildTaskFilterSearchParams } from "@/domain/common/filters";
import type {
  TaskPriority,
  TaskSortDirection,
  TaskSortOption,
  TaskStatus,
} from "@/domain/tasks/constants";

type TaskRouteFilterState = {
  sort: TaskSortOption;
  direction: TaskSortDirection;
  selectedStatuses: TaskStatus[];
  selectedPriorities: TaskPriority[];
  startDate: string | null;
  endDate: string | null;
  projectView: ProjectView;
};

export function buildMockAppFilterQuery(
  filters: TaskRouteFilterState,
  options?: { includeView?: boolean },
) {
  const params = buildTaskFilterSearchParams({
    sort: filters.sort,
    direction: filters.direction,
    status: filters.selectedStatuses,
    priority: filters.selectedPriorities,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  if (options?.includeView) {
    params.set("view", filters.projectView);
  }

  return params.toString();
}

export function buildMockTaskHref(taskId: string, filters: TaskRouteFilterState) {
  const query = buildMockAppFilterQuery(filters, { includeView: true });
  const numericTaskId = taskId.replace("TSK-", "");

  return query ? `/tasks/${numericTaskId}?${query}` : `/tasks/${numericTaskId}`;
}

export function buildMockProjectHref(
  projectId: string,
  filters: TaskRouteFilterState,
  options?: { includeView?: boolean },
) {
  const query = buildMockAppFilterQuery(filters, { includeView: options?.includeView });

  return query ? `/projects/${projectId}?${query}` : `/projects/${projectId}`;
}

export function buildMockPathQuery(
  pathname: string,
  filters: TaskRouteFilterState,
  options?: { includeView?: boolean },
) {
  const query = buildMockAppFilterQuery(filters, { includeView: options?.includeView });

  return query ? `${pathname}?${query}` : pathname;
}
