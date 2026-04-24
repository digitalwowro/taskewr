import { TaskService } from "@/server/services/task-service";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";

const service = new TaskService();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const task = await service.moveTaskOnBoard(body);
    return jsonOk(task);
  } catch (error) {
    return toErrorResponse(error);
  }
}
