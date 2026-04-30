import { ValidationError } from "@/domain/common/errors";

export function parsePositiveId(value: string, label: string, code: string) {
  const id = Number.parseInt(value, 10);

  if (!Number.isInteger(id) || id < 1 || String(id) !== value) {
    throw new ValidationError(`Invalid ${label}.`, code);
  }

  return id;
}
