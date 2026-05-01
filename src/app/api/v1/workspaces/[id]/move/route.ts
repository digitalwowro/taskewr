import { parsePositiveId } from "@/app/api/v1/workspaces/id-utils";
import type { WorkspaceMoveInput } from "@/domain/workspaces/schemas";
import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { parseJsonBody } from "@/server/api/json";
import { jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { WorkspaceAdminService } from "@/server/services/workspace-admin-service";

const service = new WorkspaceAdminService();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "workspaces:move");
    const { id } = await params;
    const body = await parseJsonBody<WorkspaceMoveInput>(request);
    const workspace = await service.moveWorkspace(
      parsePositiveId(id, "workspace id", "workspace_id_invalid"),
      body,
    );
    return jsonOk(workspace);
  } catch (error) {
    return toErrorResponse(error);
  }
}
