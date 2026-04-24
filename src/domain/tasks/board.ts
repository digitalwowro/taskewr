import { ValidationError } from "@/domain/common/errors";

export type BoardTaskOrder = {
  id: number;
  projectId: number;
  status: string;
  sortOrder: number;
};

export function assertBoardMoveWithinProject(taskProjectId: number, targetProjectId: number) {
  if (taskProjectId !== targetProjectId) {
    throw new ValidationError(
      "Board moves must stay within the same project.",
      "task_board_cross_project",
    );
  }
}

export function buildLaneOrderUpdates(taskIdsInTargetLane: number[]) {
  return taskIdsInTargetLane.map((taskId, index) => ({
    taskId,
    sortOrder: index + 1,
  }));
}
