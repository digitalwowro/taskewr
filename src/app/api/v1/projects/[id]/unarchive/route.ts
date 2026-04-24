import { ProjectService } from "@/server/services/project-service";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";

const service = new ProjectService();

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const project = await service.unarchiveProject(Number(id));
    return jsonOk(project);
  } catch (error) {
    return toErrorResponse(error);
  }
}
