import { SearchService } from "@/server/services/search-service";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from "@/domain/tasks/constants";

const service = new SearchService();

function getAllValues<T extends string>(params: URLSearchParams, key: string, allowed: readonly T[]) {
  return params.getAll(key).filter((value): value is T => allowed.includes(value as T));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const results = await service.searchTasks({
      query: searchParams.get("query") ?? "",
      sort: (searchParams.get("sort") ?? undefined) as
        | "priority"
        | "created_at"
        | "updated_at"
        | "start_date"
        | "due_date"
        | undefined,
      direction: (searchParams.get("direction") ?? undefined) as "asc" | "desc" | undefined,
      status: getAllValues(searchParams, "status", TASK_STATUSES) as TaskStatus[],
      priority: getAllValues(searchParams, "priority", TASK_PRIORITIES) as TaskPriority[],
      includeArchivedProjects: searchParams.get("includeArchivedProjects") === "true",
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    });

    return jsonOk(results);
  } catch (error) {
    return toErrorResponse(error);
  }
}
