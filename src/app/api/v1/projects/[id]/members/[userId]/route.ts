import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { parseJsonBody } from "@/server/api/json";
import { jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { ProjectService } from "@/server/services/project-service";
import type { ProjectMemberUpdateInput } from "@/domain/projects/schemas";
import { parsePositiveId } from "@/app/api/v1/workspaces/id-utils";

const service = new ProjectService();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "projects:members:update");
    const { id, userId } = await params;
    const body = await parseJsonBody<ProjectMemberUpdateInput>(request);
    const members = await service.updateProjectMember(
      parsePositiveId(id, "project id", "project_id_invalid"),
      parsePositiveId(userId, "user id", "user_id_invalid"),
      body,
    );
    return jsonOk(members);
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
    await assertMutationRateLimit(request, "projects:members:delete");
    const { id, userId } = await params;
    const members = await service.removeProjectMember(
      parsePositiveId(id, "project id", "project_id_invalid"),
      parsePositiveId(userId, "user id", "user_id_invalid"),
    );
    return jsonOk(members);
  } catch (error) {
    return toErrorResponse(error);
  }
}
