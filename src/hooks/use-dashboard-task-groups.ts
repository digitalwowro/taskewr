"use client";

import { useMemo } from "react";

import type { ProjectGroup } from "@/app/app-data";
import { sortAndFilterTaskItems } from "@/domain/dashboard/queries";
import type { TaskFilters, TaskListItem } from "@/domain/tasks/types";

export function useDashboardTaskGroups({
  groupedProjects,
  overdueItems,
  recurringOverdueItems,
  recurringTodayItems,
  taskFilters,
  todayItems,
}: {
  groupedProjects: ProjectGroup[];
  overdueItems: TaskListItem[];
  recurringOverdueItems: TaskListItem[];
  recurringTodayItems: TaskListItem[];
  taskFilters: TaskFilters;
  todayItems: TaskListItem[];
}) {
  const filteredTodayItems = useMemo(
    () => sortAndFilterTaskItems(todayItems, taskFilters),
    [taskFilters, todayItems],
  );
  const filteredRecurringOverdueItems = useMemo(
    () => sortAndFilterTaskItems(recurringOverdueItems, taskFilters),
    [recurringOverdueItems, taskFilters],
  );
  const filteredRecurringTodayItems = useMemo(
    () => sortAndFilterTaskItems(recurringTodayItems, taskFilters),
    [recurringTodayItems, taskFilters],
  );
  const filteredOverdueItems = useMemo(
    () => sortAndFilterTaskItems(overdueItems, taskFilters),
    [overdueItems, taskFilters],
  );
  const filteredProjects = useMemo(
    () =>
      groupedProjects
        .map((project) => ({
          ...project,
          items: sortAndFilterTaskItems(project.items, taskFilters),
        }))
        .filter((project) => project.items.length > 0),
    [groupedProjects, taskFilters],
  );
  const visibleTaskCount = useMemo(
    () =>
      new Set([
        ...filteredRecurringOverdueItems.map((task) => task.id),
        ...filteredRecurringTodayItems.map((task) => task.id),
        ...filteredTodayItems.map((task) => task.id),
        ...filteredOverdueItems.map((task) => task.id),
        ...filteredProjects.flatMap((project) => project.items.map((task) => task.id)),
      ]).size,
    [
      filteredOverdueItems,
      filteredProjects,
      filteredRecurringOverdueItems,
      filteredRecurringTodayItems,
      filteredTodayItems,
    ],
  );

  return {
    filteredOverdueItems,
    filteredProjects,
    filteredRecurringOverdueItems,
    filteredRecurringTodayItems,
    filteredTodayItems,
    visibleTaskCount,
  };
}
