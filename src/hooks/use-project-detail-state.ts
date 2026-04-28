"use client";

import { useMemo } from "react";

import { sortAndFilterTaskItems } from "@/domain/dashboard/queries";
import { splitProjectTaskSections } from "@/domain/projects/task-sections";
import type { TaskFilters, TaskListItem } from "@/domain/tasks/types";

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
  const selectedProjectTaskSections = useMemo(
    () => splitProjectTaskSections(selectedProjectTasks),
    [selectedProjectTasks],
  );

  return {
    projectBoardGroups,
    selectedProjectActiveTasks: selectedProjectTaskSections.active,
    selectedProjectCompletedTasks: selectedProjectTaskSections.completed,
    selectedProjectOverdueTasks: selectedProjectTaskSections.overdue,
    selectedProjectTasks,
  };
}
