import type { TaskSubtaskSummary } from "@/domain/tasks/types";

export function countDoneSubtasks(subtasks: TaskSubtaskSummary[]) {
  return subtasks.filter((subtask) => subtask.statusValue === "done").length;
}
