import { parsePositiveId } from "@/app/api/v1/workspaces/id-utils";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";
import { assertValidCsrfToken } from "@/server/api/csrf";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { UserAdminService } from "@/server/services/user-admin-service";

const service = new UserAdminService();

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; projectId: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "users:project-access:delete");
    const { id, projectId } = await params;
    const access = await service.removeUserProjectAccess(
      parsePositiveId(id, "user id", "user_id_invalid"),
      parsePositiveId(projectId, "project id", "project_id_invalid"),
    );
    return jsonOk(access);
  } catch (error) {
    return toErrorResponse(error);
  }
}
