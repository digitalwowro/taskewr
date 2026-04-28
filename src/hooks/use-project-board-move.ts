"use client";

import { useCallback } from "react";

import type { TaskStatus } from "@/domain/tasks/constants";
import type { TaskListItem } from "@/domain/tasks/types";
import { isUnauthorizedError, requestJson } from "@/lib/api-client";

export function useProjectBoardMove({
  projectId,
  redirectToLogin,
  refreshApp,
  selectedProjectTasks,
}: {
  projectId: string | null;
  redirectToLogin: () => void;
  refreshApp: () => void;
  selectedProjectTasks: TaskListItem[];
}) {
  return useCallback(
    (taskId: string, nextStatus: TaskStatus) => {
      if (!projectId) {
        return;
      }

      const task = selectedProjectTasks.find((item) => item.id === taskId);

      if (!task) {
        return;
      }

      const targetLaneTaskIds = [
        ...selectedProjectTasks
          .filter((item) => item.statusValue === nextStatus && item.id !== taskId)
          .map((item) => Number(item.id.replace("TSK-", ""))),
        Number(taskId.replace("TSK-", "")),
      ];

      void requestJson(`/api/v1/tasks/board-move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: Number(taskId.replace("TSK-", "")),
          projectId: Number(projectId),
          nextStatus,
          targetLaneTaskIds,
        }),
      })
        .then(() => {
          refreshApp();
        })
        .catch((error) => {
          if (isUnauthorizedError(error)) {
            redirectToLogin();
          }
        });
    },
    [projectId, redirectToLogin, refreshApp, selectedProjectTasks],
  );
}
