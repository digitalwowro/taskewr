import { ValidationError } from "@/domain/common/errors";
import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { jsonCreated } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { assertTaskAttachmentFile } from "@/server/services/task-attachment-storage";
import { TaskService } from "@/server/services/task-service";

export const runtime = "nodejs";

const service = new TaskService();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "tasks:attachments:create");
    const { id } = await params;
    const formData = await request.formData().catch(() => {
      throw new ValidationError("Invalid attachment upload.", "task_attachment_invalid_upload");
    });
    const file = assertTaskAttachmentFile(formData.get("file"));

    const attachment = await service.createTaskAttachment(Number(id), file);
    return jsonCreated(attachment);
  } catch (error) {
    return toErrorResponse(error);
  }
}
