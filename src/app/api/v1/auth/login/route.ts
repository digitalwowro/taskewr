import { AuthService } from "@/server/services/auth-service";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";
import { AuthenticationError, ValidationError } from "@/domain/common/errors";
import { getClientIp, loginRateLimiter } from "@/server/security/login-rate-limit";

const authService = new AuthService();

export async function POST(request: Request) {
  try {
    let body: { email?: string; password?: string };

    try {
      body = (await request.json()) as { email?: string; password?: string };
    } catch {
      throw new ValidationError("Invalid JSON body.", "invalid_json_body");
    }

    const loginInput = {
      email: body.email ?? "",
      password: body.password ?? "",
    };
    const rateLimitInput = {
      email: loginInput.email,
      ip: getClientIp(request.headers),
    };

    loginRateLimiter.assertAllowed(rateLimitInput);

    let session;

    try {
      session = await authService.loginWithPassword(loginInput);
    } catch (error) {
      if (error instanceof AuthenticationError && error.code === "auth_invalid_credentials") {
        loginRateLimiter.recordFailure(rateLimitInput);
      }

      throw error;
    }

    loginRateLimiter.recordSuccess(rateLimitInput);

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
