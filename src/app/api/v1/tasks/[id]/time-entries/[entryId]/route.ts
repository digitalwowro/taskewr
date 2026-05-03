import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { TaskService } from "@/server/services/task-service";

const service = new TaskService();

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "tasks:time-entries:delete");
    const { id, entryId } = await params;
    await service.deleteTaskTimeEntry(Number(id), Number(entryId));
    return jsonOk({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
