import { type TaskLinkMutationInput } from "@/domain/tasks/schemas";
import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { parseJsonBody } from "@/server/api/json";
import { jsonCreated } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { TaskService } from "@/server/services/task-service";

const service = new TaskService();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "tasks:links:create");
    const { id } = await params;
    const body = await parseJsonBody<TaskLinkMutationInput>(request);
    const link = await service.createTaskLink(Number(id), body);
    return jsonCreated(link);
  } catch (error) {
    return toErrorResponse(error);
  }
}
