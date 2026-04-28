import { ProjectService } from "@/server/services/project-service";
import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";

const service = new ProjectService();

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "projects:move");
    const { id } = await context.params;
    const body = await request.json();
    const project = await service.moveProject(Number(id), body);
    return jsonOk(project);
  } catch (error) {
    return toErrorResponse(error);
  }
}
