"use client";

import { useCallback, useState } from "react";

import type { TaskListItem } from "@/domain/tasks/types";
import { isUnauthorizedError, requestJson } from "@/lib/api-client";

const TASK_COMPLETION_PENDING_MS = 500;

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
      if (completingTaskId !== null) {
        return;
      }

      setCompletingTaskId(task.id);
      const isReopening = task.statusValue === "done";

      void requestJson(`/api/v1/tasks/${task.id.replace("TSK-", "")}/complete`, {
        method: isReopening ? "DELETE" : "POST",
      })
        .then(
          () =>
            new Promise<void>((resolve) => {
              window.setTimeout(resolve, TASK_COMPLETION_PENDING_MS);
            }),
        )
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
