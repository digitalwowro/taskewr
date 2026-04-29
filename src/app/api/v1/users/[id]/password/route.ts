import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { parseJsonBody } from "@/server/api/json";
import { jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { UserAdminService } from "@/server/services/user-admin-service";
import { ValidationError } from "@/domain/common/errors";
import type { AdminUserPasswordInput } from "@/domain/users/schemas";

const service = new UserAdminService();

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
    await assertMutationRateLimit(request, "users:password");
    const { id } = await params;
    const body = await parseJsonBody<AdminUserPasswordInput>(request);
    const user = await service.resetPassword(parseUserId(id), body);
    return jsonOk(user);
  } catch (error) {
    return toErrorResponse(error);
  }
}
