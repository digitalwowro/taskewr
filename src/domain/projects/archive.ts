import { ValidationError } from "@/domain/common/errors";

export function assertProjectCanArchive(isArchived: boolean) {
  if (isArchived) {
    throw new ValidationError("Project is already archived.", "project_already_archived");
  }
}

export function assertProjectCanUnarchive(isArchived: boolean) {
  if (!isArchived) {
    throw new ValidationError("Project is not archived.", "project_not_archived");
  }
}

export function nextUnarchivedSortOrder(currentMaxSortOrder: number | null): number {
  return (currentMaxSortOrder ?? 0) + 1;
}
