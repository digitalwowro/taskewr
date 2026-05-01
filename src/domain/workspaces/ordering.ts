import { ValidationError } from "@/domain/common/errors";

export function assertWorkspaceMoveTargetExists(targetSortOrder: number | null) {
  if (targetSortOrder === null) {
    throw new ValidationError(
      "Cannot move workspace because there is no adjacent workspace.",
      "workspace_move_target_missing",
    );
  }
}
