import { ProjectService } from "@/server/services/project-service";
import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { parseJsonBody } from "@/server/api/json";
import type { ProjectMoveInput } from "@/domain/projects/schemas";

const service = new ProjectService();

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "projects:move");
    const { id } = await context.params;
    const body = await parseJsonBody<ProjectMoveInput>(request);
    const project = await service.moveProject(Number(id), body);
    return jsonOk(project);
  } catch (error) {
    return toErrorResponse(error);
  }
}
