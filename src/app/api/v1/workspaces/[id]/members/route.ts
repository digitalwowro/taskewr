import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { parseJsonBody } from "@/server/api/json";
import { jsonCreated } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { WorkspaceAdminService } from "@/server/services/workspace-admin-service";
import type { WorkspaceMemberCreateInput } from "@/domain/workspaces/schemas";
import { parsePositiveId } from "@/app/api/v1/workspaces/id-utils";

const service = new WorkspaceAdminService();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "workspaces:members:create");
    const { id } = await params;
    const body = await parseJsonBody<WorkspaceMemberCreateInput>(request);
    const workspace = await service.addMember(
      parsePositiveId(id, "workspace id", "workspace_id_invalid"),
      body,
    );
    return jsonCreated(workspace);
  } catch (error) {
    return toErrorResponse(error);
  }
}
