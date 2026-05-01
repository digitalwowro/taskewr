import { toErrorResponse } from "@/server/api/errors";
import { parseJsonBody } from "@/server/api/json";
import { jsonOk } from "@/server/api/responders";
import { PasswordResetService } from "@/server/services/password-reset-service";
import type { PasswordResetConfirmInput } from "@/domain/auth/schemas";

const service = new PasswordResetService();

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<PasswordResetConfirmInput>(request);
    const result = await service.confirmPasswordReset(body);
    return jsonOk(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
