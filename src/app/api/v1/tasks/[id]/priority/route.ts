import { z } from "zod";
import { TaskService } from "@/server/services/task-service";
import { taskPrioritySchema } from "@/domain/tasks/schemas";
import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";

const service = new TaskService();
const schema = z.object({ priority: taskPrioritySchema });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertValidCsrfToken(request);
    const { id } = await params;
    const body = await request.json();
    const { priority } = schema.parse(body);
    await service.setPriority(Number(id), priority);
    return jsonOk({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
