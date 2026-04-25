"use client";

import { useEffect, useMemo, useState } from "react";

import type { AppProject } from "@/app/app-data";
import type { TaskPriority, TaskStatus } from "@/domain/tasks/constants";
import type { TaskListItem } from "@/domain/tasks/types";
import type { RepeatSettingsInput } from "@/domain/tasks/repeat-schemas";
import { isUnauthorizedError, requestJson } from "@/lib/api-client";

export const NEW_TASK_ID = "NEW_TASK";

export type TaskMutationInput = {
  projectId: number;
  title: string;
  description: string;
  parentTaskId: number | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string | null;
  dueDate: string | null;
  labels: string[];
  repeat: RepeatSettingsInput;
};

type UseTaskEditorStateInput = {
  activeProjects: AppProject[];
  allTasks: TaskListItem[];
  closeTaskRoute: () => void;
  defaultTaskProjectId: string;
  initialSection: string;
  initialTaskId?: string;
  redirectToLogin: () => void;
  refreshApp: () => void;
};

export function useTaskEditorState({
  activeProjects,
  allTasks,
  closeTaskRoute,
  defaultTaskProjectId,
  initialSection,
  initialTaskId,
  redirectToLogin,
  refreshApp,
}: UseTaskEditorStateInput) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskMutationPending, setTaskMutationPending] = useState(false);
  const [taskMutationError, setTaskMutationError] = useState<string | null>(null);

  const editingTask = useMemo(
    () => allTasks.find((task) => task.id === editingTaskId) ?? null,
    [allTasks, editingTaskId],
  );

  const createTaskDraft = useMemo<TaskListItem | null>(() => {
    if (editingTaskId !== NEW_TASK_ID || !defaultTaskProjectId) {
      return null;
    }

    const draftProject =
      activeProjects.find((project) => project.id === defaultTaskProjectId) ?? activeProjects[0];

    if (!draftProject) {
      return null;
    }

    return {
      id: NEW_TASK_ID,
      projectId: draftProject.id,
      title: "",
      project: draftProject.name,
      status: "Todo",
      statusValue: "todo",
      due: "",
      dueDate: null,
      priority: "Medium",
      priorityValue: "medium",
      startDate: null,
      repeatRuleId: null,
      repeatScheduledFor: null,
      repeatCarryCount: 0,
      createdAt: "",
      updatedAt: "",
    };
  }, [activeProjects, defaultTaskProjectId, editingTaskId]);

  const taskEditorTask = editingTask ?? createTaskDraft;

  useEffect(() => {
    setTaskMutationError(null);
  }, [editingTaskId, initialTaskId]);

  const handleTaskSave = async (targetTask: TaskListItem, input: TaskMutationInput) => {
    setTaskMutationPending(true);
    setTaskMutationError(null);

    try {
      if (targetTask.id === NEW_TASK_ID) {
        await requestJson(`/api/v1/tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
      } else {
        await requestJson(`/api/v1/tasks/${targetTask.id.replace("TSK-", "")}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
      }

      refreshApp();

      if (initialSection === "dashboard" || targetTask.id === NEW_TASK_ID) {
        setEditingTaskId(null);
      } else {
        closeTaskRoute();
      }
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setTaskMutationError(error instanceof Error ? error.message : "Could not save task.");
    } finally {
      setTaskMutationPending(false);
    }
  };

  return {
    editingTaskId,
    setEditingTaskId,
    taskEditorTask,
    taskMutationError,
    taskMutationPending,
    handleTaskSave,
  };
}
