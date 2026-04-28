"use client";

import { useCallback, useState } from "react";

import type { TaskListItem } from "@/domain/tasks/types";
import { isUnauthorizedError, requestJson } from "@/lib/api-client";

export function useTaskCompletion({
  redirectToLogin,
  refreshApp,
}: {
  redirectToLogin: () => void;
  refreshApp: () => void;
}) {
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const completeTask = useCallback(
    (task: Pick<TaskListItem, "id" | "statusValue">) => {
      if (task.statusValue === "done" || completingTaskId !== null) {
        return;
      }

      setCompletingTaskId(task.id);

      void requestJson(`/api/v1/tasks/${task.id.replace("TSK-", "")}/complete`, {
        method: "POST",
      })
        .then(() => {
          refreshApp();
        })
        .catch((error) => {
          if (isUnauthorizedError(error)) {
            redirectToLogin();
          }
        })
        .finally(() => {
          setCompletingTaskId(null);
        });
    },
    [completingTaskId, redirectToLogin, refreshApp],
  );

  return {
    completingTaskId,
    completeTask,
  };
}
