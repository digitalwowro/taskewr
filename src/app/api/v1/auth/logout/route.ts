import { AuthService } from "@/server/services/auth-service";
import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";

const authService = new AuthService();

export async function POST() {
  try {
    await authService.clearSessionCookie();
    return jsonOk({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
