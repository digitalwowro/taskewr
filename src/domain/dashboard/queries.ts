import type { TaskFilters, TaskListItem } from "@/domain/tasks/types";
import { TASK_PRIORITY_RANK } from "@/domain/tasks/constants";

function getDateRank(value: string | null) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  return new Date(value).getTime();
}

export function sortTaskItems(items: TaskListItem[], filters: TaskFilters): TaskListItem[] {
  const modifier = filters.direction === "asc" ? 1 : -1;

  return [...items].sort((a, b) => {
    switch (filters.sort) {
      case "created_at":
        return (getDateRank(a.createdAt) - getDateRank(b.createdAt)) * modifier;
      case "updated_at":
        return (getDateRank(a.updatedAt) - getDateRank(b.updatedAt)) * modifier;
      case "start_date":
        return (getDateRank(a.startDate) - getDateRank(b.startDate)) * modifier;
      case "due_date":
        return (getDateRank(a.dueDate) - getDateRank(b.dueDate)) * modifier;
      case "priority":
      default:
        return (TASK_PRIORITY_RANK[a.priorityValue] - TASK_PRIORITY_RANK[b.priorityValue]) * modifier;
    }
  });
}

export function filterTaskItems(items: TaskListItem[], filters: TaskFilters): TaskListItem[] {
  return items.filter((item) => {
    const statusMatch =
      filters.status.length === 0 || filters.status.includes(item.statusValue);
    const priorityMatch =
      filters.priority.length === 0 || filters.priority.includes(item.priorityValue);
    const itemDueDate = item.dueDate ? item.dueDate.slice(0, 10) : null;
    const startDateMatch =
      !filters.startDate || (itemDueDate !== null && itemDueDate >= filters.startDate);
    const endDateMatch =
      !filters.endDate || (itemDueDate !== null && itemDueDate <= filters.endDate);

    return statusMatch && priorityMatch && startDateMatch && endDateMatch;
  });
}
