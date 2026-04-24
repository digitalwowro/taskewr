import { ProjectService } from "@/server/services/project-service";
import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";

const service = new ProjectService();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertValidCsrfToken(request);
    const { id } = await params;
    const project = await service.archiveProject(Number(id));
    return jsonOk(project);
  } catch (error) {
    return toErrorResponse(error);
  }
}
