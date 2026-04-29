import { assertValidCsrfToken } from "@/server/api/csrf";
import { toErrorResponse } from "@/server/api/errors";
import { parseJsonBody } from "@/server/api/json";
import { jsonCreated, jsonOk } from "@/server/api/responders";
import { assertMutationRateLimit } from "@/server/security/mutation-rate-limit";
import { UserAdminService } from "@/server/services/user-admin-service";
import type { AdminUserCreateInput } from "@/domain/users/schemas";

const service = new UserAdminService();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const users = await service.listUsers({
      query: url.searchParams.get("query") ?? "",
      includeInactive: url.searchParams.get("includeInactive") === "true",
    });

    return jsonOk(users);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertValidCsrfToken(request);
    await assertMutationRateLimit(request, "users:create");
    const body = await parseJsonBody<AdminUserCreateInput>(request);
    const user = await service.createUser(body);
    return jsonCreated(user);
  } catch (error) {
    return toErrorResponse(error);
  }
}
