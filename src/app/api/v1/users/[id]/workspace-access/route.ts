import { parsePositiveId } from "@/app/api/v1/workspaces/id-utils";
import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { parseJsonBody } from "@/server/api/json";
import { jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { UserAdminService } from "@/server/services/user-admin-service";
import type { WorkspaceMemberUpdateInput } from "@/domain/workspaces/schemas";

const service = new UserAdminService();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "users:workspace-access:create");
    const { id } = await params;
    const body = await parseJsonBody<WorkspaceMemberUpdateInput & { workspaceId: number }>(request);
    const access = await service.addUserWorkspaceAccess(
      parsePositiveId(id, "user id", "user_id_invalid"),
      body,
    );
    return jsonOk(access);
  } catch (error) {
    return toErrorResponse(error);
  }
}
