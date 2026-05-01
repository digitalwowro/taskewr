import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { TaskNotificationService } from "@/server/services/task-notification-service";

const service = new TaskNotificationService();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "tasks:subscription");
    const { id } = await params;
    const result = await service.subscribeCurrentUser(Number(id));
    return jsonOk(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "tasks:subscription");
    const { id } = await params;
    const result = await service.unsubscribeCurrentUser(Number(id));
    return jsonOk(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
