import { ProjectService } from "@/server/services/project-service";
import { toErrorResponse } from "@/server/api/errors";
import { jsonCreated, jsonOk } from "@/server/api/responders";

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
    const body = await request.json();
    const project = await service.createProject(body);
    return jsonCreated(project);
  } catch (error) {
    return toErrorResponse(error);
  }
}
