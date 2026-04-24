import { AuthService } from "@/server/services/auth-service";
import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";

const authService = new AuthService();

export async function POST(request: Request) {
  try {
    assertValidCsrfToken(request);
    await authService.clearSessionCookie();
    return jsonOk({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
