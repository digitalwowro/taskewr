"use client";

import { useMemo } from "react";

import { sortAndFilterTaskItems } from "@/domain/dashboard/queries";
import type { TaskFilters, TaskListItem } from "@/domain/tasks/types";
import { isOverdueDate } from "@/lib/time/dashboard-dates";

export function useProjectDetailState({
  projectId,
  projectTasksByProjectId,
  taskFilters,
}: {
  projectId: string | null;
  projectTasksByProjectId: Record<string, TaskListItem[]>;
  taskFilters: TaskFilters;
}) {
  const selectedProjectTasks = useMemo(() => {
    if (!projectId) {
      return [];
    }

    return sortAndFilterTaskItems(projectTasksByProjectId[projectId] ?? [], taskFilters);
  }, [projectId, projectTasksByProjectId, taskFilters]);
  const projectBoardGroups = useMemo(
    () => ({
      todo: selectedProjectTasks.filter((task) => task.statusValue === "todo"),
      inProgress: selectedProjectTasks.filter((task) => task.statusValue === "in_progress"),
      completed: selectedProjectTasks.filter((task) => task.statusValue === "done"),
    }),
    [selectedProjectTasks],
  );
  const selectedProjectOverdueTasks = useMemo(
    () =>
      selectedProjectTasks.filter((task) => (
        isOverdueDate(task.dueDate ? new Date(task.dueDate) : null)
      )),
    [selectedProjectTasks],
  );

  return {
    projectBoardGroups,
    selectedProjectOverdueTasks,
    selectedProjectTasks,
  };
}
