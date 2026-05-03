import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { TaskService } from "@/server/services/task-service";

export const runtime = "nodejs";

const service = new TaskService();

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "tasks:attachments:delete");
    const { id, attachmentId } = await params;
    await service.deleteTaskAttachment(Number(id), Number(attachmentId));
    return jsonOk({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
