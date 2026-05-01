import { ValidationError } from "@/domain/common/errors";
import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { PasswordResetService } from "@/server/services/password-reset-service";

const service = new PasswordResetService();

function parseUserId(id: string) {
  const userId = Number.parseInt(id, 10);

  if (!Number.isInteger(userId) || userId < 1 || String(userId) !== id) {
    throw new ValidationError("Invalid user id.", "user_id_invalid");
  }

  return userId;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "users:password-reset-email");
    const { id } = await params;
    const result = await service.sendAdminPasswordResetEmail(parseUserId(id));
    return jsonOk(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
