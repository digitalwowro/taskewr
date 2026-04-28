import { ProjectService } from "@/server/services/project-service";
import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { jsonCreated, jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { parseJsonBody } from "@/server/api/json";
import type { ProjectMutationInput } from "@/domain/projects/schemas";

const service = new ProjectService();

export async function GET() {
  try {
    const projects = await service.listProjects(true);
    return jsonOk(projects);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "projects:create");
    const body = await parseJsonBody<ProjectMutationInput>(request);
    const project = await service.createProject(body);
    return jsonCreated(project);
  } catch (error) {
    return toErrorResponse(error);
  }
}
