import { AuthenticationError } from "@/domain/common/errors";
import { AuthService } from "@/server/services/auth-service";

export type AppContext = {
  workspaceId: number;
  actorUserId: number | null;
  workspaceRole: string;
  timezone: string | null;
};

export class AppContextService {
  constructor(private readonly authService = new AuthService()) {}

  async getAppContext(): Promise<AppContext> {
    const actor = await this.authService.getAuthenticatedActor();

    if (!actor) {
      throw new AuthenticationError("Not authenticated.", "auth_not_authenticated");
    }

    return {
      workspaceId: actor.workspaceId,
      actorUserId: actor.userId,
      workspaceRole: actor.workspaceRole,
      timezone: actor.timezone,
    };
  }
}
