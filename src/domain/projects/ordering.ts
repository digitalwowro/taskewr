import { ValidationError } from "@/domain/common/errors";

export function assertProjectMoveTargetExists(targetSortOrder: number | null) {
  if (targetSortOrder === null) {
    throw new ValidationError("Cannot move project because there is no adjacent project.", "project_move_target_missing");
  }
}

export function swapSortOrders(currentSortOrder: number, targetSortOrder: number) {
  return {
    currentSortOrder: targetSortOrder,
    targetSortOrder: currentSortOrder,
  };
}
