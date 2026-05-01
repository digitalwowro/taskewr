import { toErrorResponse } from "@/server/api/errors";
import { parseJsonBody } from "@/server/api/json";
import { jsonOk } from "@/server/api/responders";
import { getClientIp } from "@/server/security/login-rate-limit";
import { passwordResetRateLimiter } from "@/server/security/password-reset-rate-limit";
import { PasswordResetService } from "@/server/services/password-reset-service";
import type { PasswordResetRequestInput } from "@/domain/auth/schemas";

const service = new PasswordResetService();

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<PasswordResetRequestInput>(request);
    const ip = getClientIp(request.headers);

    passwordResetRateLimiter.consume({
      email: body.email ?? "",
      ip,
    });

    const result = await service.requestPasswordReset(body, {
      ip,
      userAgent: request.headers.get("user-agent"),
    });

    return jsonOk(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
