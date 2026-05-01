import { parsePositiveId } from "@/app/api/v1/workspaces/id-utils";
import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { UserAdminService } from "@/server/services/user-admin-service";

const service = new UserAdminService();

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; workspaceId: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "users:workspace-access:delete");
    const { id, workspaceId } = await params;
    const access = await service.removeUserWorkspaceAccess(
      parsePositiveId(id, "user id", "user_id_invalid"),
      parsePositiveId(workspaceId, "workspace id", "workspace_id_invalid"),
    );
    return jsonOk(access);
  } catch (error) {
    return toErrorResponse(error);
  }
}
