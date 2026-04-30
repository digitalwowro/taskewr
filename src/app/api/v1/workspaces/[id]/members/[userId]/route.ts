import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { parseJsonBody } from "@/server/api/json";
import { jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { WorkspaceAdminService } from "@/server/services/workspace-admin-service";
import type { WorkspaceMemberUpdateInput } from "@/domain/workspaces/schemas";
import { parsePositiveId } from "@/app/api/v1/workspaces/id-utils";

const service = new WorkspaceAdminService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const { id, userId } = await params;
    const member = await service.getMemberDetails(
      parsePositiveId(id, "workspace id", "workspace_id_invalid"),
      parsePositiveId(userId, "user id", "user_id_invalid"),
    );
    return jsonOk(member);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "workspaces:members:update");
    const { id, userId } = await params;
    const body = await parseJsonBody<WorkspaceMemberUpdateInput>(request);
    const workspace = await service.updateMember(
      parsePositiveId(id, "workspace id", "workspace_id_invalid"),
      parsePositiveId(userId, "user id", "user_id_invalid"),
      body,
    );
    return jsonOk(workspace);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "workspaces:members:delete");
    const { id, userId } = await params;
    const workspace = await service.removeMember(
      parsePositiveId(id, "workspace id", "workspace_id_invalid"),
      parsePositiveId(userId, "user id", "user_id_invalid"),
    );
    return jsonOk(workspace);
  } catch (error) {
    return toErrorResponse(error);
  }
}
