import { toErrorResponse } from "@/server/api/errors";
import { parseJsonBody } from "@/server/api/json";
import { jsonOk } from "@/server/api/responders";
import { assertValidCsrfToken } from "@/server/api/csrf";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { UserAdminService } from "@/server/services/user-admin-service";
import { ValidationError } from "@/domain/common/errors";
import type { ProjectMemberUpdateInput } from "@/domain/projects/schemas";

const service = new UserAdminService();

function parseUserId(id: string) {
  const userId = Number.parseInt(id, 10);

  if (!Number.isInteger(userId) || userId < 1 || String(userId) !== id) {
    throw new ValidationError("Invalid user id.", "user_id_invalid");
  }

  return userId;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const access = await service.getUserProjectAccess(parseUserId(id));
    return jsonOk(access);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "users:project-access:create");
    const { id } = await params;
    const body = await parseJsonBody<ProjectMemberUpdateInput & { projectId: number }>(request);
    const access = await service.addUserProjectAccess(parseUserId(id), body);
    return jsonOk(access);
  } catch (error) {
    return toErrorResponse(error);
  }
}
