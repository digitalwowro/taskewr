import { AuthenticationError } from "@/domain/common/errors";
import { db } from "@/lib/db";
import { AuthService } from "@/server/services/auth-service";
import type { PrismaClient } from "@/generated/prisma/client";

export type AppContext = {
  workspaceId: number;
  actorUserId: number;
  workspaceRole: string;
  appRole: string;
  workspaces: {
    id: number;
    name: string;
    slug: string;
    role: string;
  }[];
  accessibleWorkspaceIds: number[];
  accessibleProjectIds: number[];
  timezone: string | null;
};

export class AppContextService {
  constructor(
    private readonly authService = new AuthService(),
    private readonly database: Pick<PrismaClient, "projectMember"> = db,
  ) {}

  async getAppContext(): Promise<AppContext> {
    const actor = await this.authService.getAuthenticatedActor();

    if (!actor) {
      throw new AuthenticationError("Not authenticated.", "auth_not_authenticated");
    }

    const projectMemberships = await this.database.projectMember.findMany({
      where: {
        userId: actor.userId,
      },
      select: {
        projectId: true,
      },
      orderBy: {
        projectId: "asc",
      },
    });

    return {
      workspaceId: actor.workspaceId,
      actorUserId: actor.userId,
      workspaceRole: actor.workspaceRole,
      appRole: actor.appRole,
      workspaces: actor.workspaceMemberships.map((membership) => ({
        id: membership.workspaceId,
        name: membership.workspaceName,
        slug: membership.workspaceSlug,
        role: membership.role,
      })),
      accessibleWorkspaceIds: actor.accessibleWorkspaceIds,
      accessibleProjectIds: projectMemberships.map((membership) => membership.projectId),
      timezone: actor.timezone,
    };
  }
}
