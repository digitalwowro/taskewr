import { TaskService } from "@/server/services/task-service";
import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";

const service = new TaskService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const task = await service.getTask(Number(id));
    return jsonOk(task);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertValidCsrfToken(request);
    const { id } = await params;
    const body = await request.json();
    const task = await service.updateTask(Number(id), body);
    return jsonOk(task);
  } catch (error) {
    return toErrorResponse(error);
  }
}
