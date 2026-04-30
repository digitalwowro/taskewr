import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { parseJsonBody } from "@/server/api/json";
import { jsonCreated, jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { WorkspaceAdminService } from "@/server/services/workspace-admin-service";
import type { WorkspaceMutationInput } from "@/domain/workspaces/schemas";

const service = new WorkspaceAdminService();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const workspaces = await service.listWorkspaces({
      query: url.searchParams.get("query") ?? "",
    });

    return jsonOk(workspaces);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "workspaces:create");
    const body = await parseJsonBody<WorkspaceMutationInput>(request);
    const workspace = await service.createWorkspace(body);
    return jsonCreated(workspace);
  } catch (error) {
    return toErrorResponse(error);
  }
}
