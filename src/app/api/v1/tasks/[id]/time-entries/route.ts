import { type TaskTimeEntryMutationInput } from "@/domain/tasks/schemas";
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
    await assertMutationRateLimit(request, "tasks:time-entries:create");
    const { id } = await params;
    const body = await parseJsonBody<TaskTimeEntryMutationInput>(request);
    const entry = await service.createTaskTimeEntry(Number(id), body);
    return jsonCreated(entry);
  } catch (error) {
    return toErrorResponse(error);
  }
}
