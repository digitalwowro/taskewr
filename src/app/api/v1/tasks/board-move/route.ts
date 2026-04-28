import { TaskService } from "@/server/services/task-service";
import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { parseJsonBody } from "@/server/api/json";
import type { BoardMoveInput } from "@/domain/tasks/schemas";

const service = new TaskService();

export async function POST(request: Request) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "tasks:board-move");
    const body = await parseJsonBody<BoardMoveInput>(request);
    const task = await service.moveTaskOnBoard(body);
    return jsonOk(task);
  } catch (error) {
    return toErrorResponse(error);
  }
}
