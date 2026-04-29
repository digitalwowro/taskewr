import { AuthService } from "@/server/services/auth-service";
import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { jsonError, jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { parseJsonBody } from "@/server/api/json";

const authService = new AuthService();

export async function GET() {
  const profile = await authService.getCurrentUserProfile();

  if (!profile) {
    return jsonError("Not authenticated.", "auth_not_authenticated", 401, {
      authenticated: false,
    });
  }

  return jsonOk({
    authenticated: true,
    userId: profile.id,
    workspaceId: profile.workspaceId,
    workspaceRole: profile.workspaceRole,
    appRole: profile.appRole,
    timezone: profile.timezone,
    name: profile.name,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
  });
}

export async function PATCH(request: Request) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "profile:update", authService);
    const payload = await parseJsonBody<{
      name: string;
      email: string;
      currentPassword?: string;
      newPassword?: string;
      avatarUrl?: string | null;
    }>(request);

    const profile = await authService.updateCurrentUserProfile(payload);

    return jsonOk({
      authenticated: true,
      userId: profile.id,
      workspaceId: profile.workspaceId,
      workspaceRole: profile.workspaceRole,
      appRole: profile.appRole,
      timezone: profile.timezone,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
