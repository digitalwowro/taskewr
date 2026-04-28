import { TaskService } from "@/server/services/task-service";
import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { jsonCreated } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";

const service = new TaskService();

export async function POST(request: Request) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "tasks:create");
    const body = await request.json();
    const task = await service.createTask(body);
    return jsonCreated(task);
  } catch (error) {
    return toErrorResponse(error);
  }
}
