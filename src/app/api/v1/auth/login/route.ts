import { AuthService } from "@/server/services/auth-service";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";
import { ValidationError } from "@/domain/common/errors";

const authService = new AuthService();

export async function POST(request: Request) {
  try {
    let body: { email?: string; password?: string };

    try {
      body = (await request.json()) as { email?: string; password?: string };
    } catch {
      throw new ValidationError("Invalid JSON body.", "invalid_json_body");
    }

    const session = await authService.loginWithPassword({
      email: body.email ?? "",
      password: body.password ?? "",
    });

    await authService.setSessionCookie(session);

    return jsonOk({
      userId: session.userId,
      workspaceId: session.workspaceId,
      workspaceRole: session.workspaceRole,
      timezone: session.timezone,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
