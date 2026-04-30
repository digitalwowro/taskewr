import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { parseJsonBody } from "@/server/api/json";
import { jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { WorkspaceAdminService } from "@/server/services/workspace-admin-service";
import type { WorkspaceMutationInput } from "@/domain/workspaces/schemas";
import { parsePositiveId } from "@/app/api/v1/workspaces/id-utils";

const service = new WorkspaceAdminService();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "workspaces:update");
    const { id } = await params;
    const body = await parseJsonBody<WorkspaceMutationInput>(request);
    const workspace = await service.updateWorkspace(
      parsePositiveId(id, "workspace id", "workspace_id_invalid"),
      body,
    );
    return jsonOk(workspace);
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
    await assertMutationRateLimit(request, "workspaces:delete");
    const { id } = await params;
    const result = await service.deleteWorkspace(
      parsePositiveId(id, "workspace id", "workspace_id_invalid"),
    );
    return jsonOk(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
