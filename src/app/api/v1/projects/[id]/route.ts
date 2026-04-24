import { ProjectService } from "@/server/services/project-service";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";

const service = new ProjectService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const project = await service.getProject(Number(id));
    return jsonOk(project);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const project = await service.updateProject(Number(id), body);
    return jsonOk(project);
  } catch (error) {
    return toErrorResponse(error);
  }
}
