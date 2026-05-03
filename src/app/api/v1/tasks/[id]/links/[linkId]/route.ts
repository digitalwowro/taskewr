import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { TaskService } from "@/server/services/task-service";

const service = new TaskService();

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; linkId: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "tasks:links:delete");
    const { id, linkId } = await params;
    await service.deleteTaskLink(Number(id), Number(linkId));
    return jsonOk({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
