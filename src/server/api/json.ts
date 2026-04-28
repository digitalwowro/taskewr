import { ValidationError } from "@/domain/common/errors";

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ValidationError("Invalid JSON body.", "invalid_json_body");
  }
}
