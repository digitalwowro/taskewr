import { toErrorResponse } from "@/server/api/errors";
import { jsonOk } from "@/server/api/responders";
import { WorkspaceAdminService } from "@/server/services/workspace-admin-service";

const service = new WorkspaceAdminService();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const users = await service.listUserCandidates({
      query: url.searchParams.get("query") ?? "",
    });

    return jsonOk(users);
  } catch (error) {
    return toErrorResponse(error);
  }
}
