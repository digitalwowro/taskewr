import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { parseJsonBody } from "@/server/api/json";
import { jsonCreated, jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { ProjectService } from "@/server/services/project-service";
import type { ProjectMemberCreateInput } from "@/domain/projects/schemas";
import { parsePositiveId } from "@/app/api/v1/workspaces/id-utils";

const service = new ProjectService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const members = await service.getProjectMembers(
      parsePositiveId(id, "project id", "project_id_invalid"),
    );
    return jsonOk(members);
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
    await assertMutationRateLimit(request, "projects:members:create");
    const { id } = await params;
    const body = await parseJsonBody<ProjectMemberCreateInput>(request);
    const members = await service.addProjectMember(
      parsePositiveId(id, "project id", "project_id_invalid"),
      body,
    );
    return jsonCreated(members);
  } catch (error) {
    return toErrorResponse(error);
  }
}
