import { assertCanManageUsers } from "@/domain/auth/policies";
import { NotFoundError, ValidationError } from "@/domain/common/errors";
import {
  projectMemberUpdateSchema,
  type ProjectMemberUpdateInput,
} from "@/domain/projects/schemas";
import {
  workspaceMemberUpdateSchema,
  type WorkspaceMemberUpdateInput,
} from "@/domain/workspaces/schemas";
import {
  adminUserCreateSchema,
  adminUserPasswordSchema,
  adminUserUpdateSchema,
  userListQuerySchema,
  type AdminUserCreateInput,
  type AdminUserPasswordInput,
  type AdminUserUpdateInput,
  type UserListQueryInput,
} from "@/domain/users/schemas";
import {
  UsersRepository,
  type UserAvailableWorkspaceRecord,
  type UserAdminRecord,
  type UserProjectAccessRecord,
} from "@/data/prisma/repositories/users-repository";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { AppContextService, type AppContext } from "@/server/services/app-context-service";
import { personalWorkspaceName, slugifyWorkspaceName } from "@/domain/workspaces/slug";

export type UserAdminItem = {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  timezone: string | null;
  appRole: string;
  isActive: boolean;
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserProjectAccess = {
  user: {
    id: number;
    name: string;
    email: string;
  };
  availableWorkspaces: {
    id: number;
    name: string;
    slug: string;
  }[];
  workspaces: {
    id: number;
    name: string;
    slug: string;
    role: string;
    availableProjects: {
      id: number;
      name: string;
      isArchived: boolean;
    }[];
    projects: {
      id: number;
      name: string;
      role: string;
      isArchived: boolean;
    }[];
  }[];
};

function toUserAdminItem(user: UserAdminRecord): UserAdminItem {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    timezone: user.timezone,
    appRole: user.appRole,
    isActive: user.deactivatedAt === null,
    deactivatedAt: user.deactivatedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toUserProjectAccess(
  user: UserProjectAccessRecord,
  availableWorkspaces: UserAvailableWorkspaceRecord[],
): UserProjectAccess {
  const projectsByWorkspaceId = new Map<number, UserProjectAccess["workspaces"][number]["projects"]>();

  for (const membership of user.projectMemberships) {
    const workspaceId = membership.project.workspaceId;

    if (workspaceId === null) {
      continue;
    }

    const projects = projectsByWorkspaceId.get(workspaceId) ?? [];
    projects.push({
      id: membership.project.id,
      name: membership.project.name,
      role: membership.role,
      isArchived: membership.project.archivedAt !== null,
    });
    projectsByWorkspaceId.set(workspaceId, projects);
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    availableWorkspaces,
    workspaces: user.memberships.map((membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      role: membership.role,
      availableProjects: membership.workspace.projects.map((project) => ({
        id: project.id,
        name: project.name,
        isArchived: project.archivedAt !== null,
      })),
      projects: (projectsByWorkspaceId.get(membership.workspace.id) ?? []).sort((first, second) =>
        first.name.localeCompare(second.name),
      ),
    })),
  };
}

function parsePositiveInteger(value: unknown, label: string, code: string) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue < 1) {
    throw new ValidationError(`Invalid ${label}.`, code);
  }

  return numberValue;
}

export class UserAdminService {
  constructor(
    private readonly repository = new UsersRepository(db),
    private readonly contextService = new AppContextService(),
  ) {}

  private async getAdminContext(): Promise<AppContext> {
    const context = await this.contextService.getAppContext();
    assertCanManageUsers({ appRole: context.appRole });
    return context;
  }

  private async assertEmailAvailable(email: string, currentUserId?: number) {
    const existingUser = await this.repository.findByEmail(email);

    if (existingUser && existingUser.id !== currentUserId) {
      throw new ValidationError("Email address is already in use.", "user_email_taken");
    }
  }

  private async assertCanRemoveActiveAdmin(targetUser: UserAdminRecord) {
    if (targetUser.appRole !== "admin" || targetUser.deactivatedAt) {
      return;
    }

    const activeAdminCount = await this.repository.countActiveAdmins();

    if (activeAdminCount <= 1) {
      throw new ValidationError(
        "At least one active app admin is required.",
        "user_last_admin",
      );
    }
  }

  private async generateUniqueWorkspaceSlug(baseName: string) {
    const baseSlug = slugifyWorkspaceName(baseName);
    let candidate = baseSlug;
    let suffix = 2;

    while (await this.repository.workspaceSlugExists(candidate)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  async listUsers(input: UserListQueryInput = {}) {
    await this.getAdminContext();
    const payload = userListQuerySchema.parse(input);
    const users = await this.repository.listUsers(payload);

    return users.map(toUserAdminItem);
  }

  async getUserProjectAccess(userId: number) {
    await this.getAdminContext();
    const user = await this.repository.findProjectAccessById(userId);

    if (!user) {
      throw new NotFoundError("User not found.", "user_not_found");
    }

    const availableWorkspaces = await this.repository.listAvailableWorkspacesForUser(userId);

    return toUserProjectAccess(user, availableWorkspaces);
  }

  async addUserProjectAccess(userId: number, input: ProjectMemberUpdateInput & { projectId: number }) {
    await this.getAdminContext();
    const projectId = parsePositiveInteger(input.projectId, "project id", "project_id_invalid");
    const payload = projectMemberUpdateSchema.parse({ role: input.role });
    const project = await this.repository.findProjectAvailableToUser(userId, projectId);

    if (!project) {
      throw new ValidationError(
        "Project is not available for this user.",
        "project_access_not_available",
      );
    }

    await this.repository.addProjectMembership(userId, projectId, payload.role);

    return this.getUserProjectAccess(userId);
  }

  async addUserWorkspaceAccess(userId: number, input: WorkspaceMemberUpdateInput & { workspaceId: number }) {
    await this.getAdminContext();
    const workspaceId = parsePositiveInteger(input.workspaceId, "workspace id", "workspace_id_invalid");
    const payload = workspaceMemberUpdateSchema.parse({ role: input.role });
    const workspace = await this.repository.findWorkspaceAvailableToUser(userId, workspaceId);

    if (!workspace) {
      throw new ValidationError(
        "Workspace is not available for this user.",
        "workspace_access_not_available",
      );
    }

    await this.repository.addWorkspaceMembership(userId, workspaceId, payload.role);

    return this.getUserProjectAccess(userId);
  }

  async removeUserWorkspaceAccess(userId: number, workspaceId: number) {
    await this.getAdminContext();
    const membership = await this.repository.findWorkspaceMembership(userId, workspaceId);

    if (!membership) {
      throw new NotFoundError("Workspace access not found.", "workspace_access_not_found");
    }

    const projectMemberships =
      await this.repository.countUserProjectMembershipsInWorkspace(userId, workspaceId);

    if (projectMemberships > 0) {
      throw new ValidationError(
        "Remove this user's project access before removing them from the workspace.",
        "workspace_member_has_projects",
      );
    }

    const workspaceMemberships = await this.repository.countUserWorkspaceMemberships(userId);

    if (workspaceMemberships <= 1) {
      throw new ValidationError(
        "A user must belong to at least one workspace.",
        "workspace_member_last_workspace",
      );
    }

    if (membership.role === "owner" && membership.user.deactivatedAt === null) {
      const ownerCount = await this.repository.countActiveWorkspaceOwners(workspaceId);

      if (ownerCount <= 1) {
        throw new ValidationError(
          "At least one active workspace owner is required.",
          "workspace_last_owner",
        );
      }
    }

    await this.repository.removeWorkspaceMembership(userId, workspaceId);

    return this.getUserProjectAccess(userId);
  }

  async removeUserProjectAccess(userId: number, projectId: number) {
    await this.getAdminContext();
    const membership = await this.repository.findProjectMembership(userId, projectId);

    if (!membership) {
      throw new NotFoundError("Project access not found.", "project_access_not_found");
    }

    if (membership.role === "owner" && membership.user.deactivatedAt === null) {
      const ownerCount = await this.repository.countActiveProjectOwners(projectId);

      if (ownerCount <= 1) {
        throw new ValidationError(
          "At least one active project owner is required.",
          "project_last_owner",
        );
      }
    }

    await this.repository.removeProjectMembership(userId, projectId);

    return this.getUserProjectAccess(userId);
  }

  async createUser(input: AdminUserCreateInput) {
    await this.getAdminContext();
    const payload = adminUserCreateSchema.parse(input);
    await this.assertEmailAvailable(payload.email);

    const workspaceName = personalWorkspaceName({
      name: payload.name,
      email: payload.email,
    });
    const workspaceSlug = await this.generateUniqueWorkspaceSlug(workspaceName);

    const user = await this.repository.createWithPersonalWorkspace({
      name: payload.name,
      email: payload.email,
      passwordHash: hashPassword(payload.password),
      timezone: payload.timezone ?? null,
      appRole: payload.appRole,
    }, {
      name: workspaceName,
      slug: workspaceSlug,
    });

    return toUserAdminItem(user);
  }

  async updateUser(userId: number, input: AdminUserUpdateInput) {
    const context = await this.getAdminContext();
    const payload = adminUserUpdateSchema.parse(input);
    const targetUser = await this.repository.findById(userId);

    if (!targetUser) {
      throw new NotFoundError("User not found.", "user_not_found");
    }

    if (payload.email) {
      await this.assertEmailAvailable(payload.email, userId);
    }

    if (payload.isActive === false) {
      if (context.actorUserId === userId) {
        throw new ValidationError("You cannot deactivate your own account.", "user_self_deactivate");
      }

      await this.assertCanRemoveActiveAdmin(targetUser);
    }

    if (payload.appRole && payload.appRole !== "admin") {
      await this.assertCanRemoveActiveAdmin(targetUser);
    }

    const user = await this.repository.updateById(userId, {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {}),
      ...(payload.timezone !== undefined ? { timezone: payload.timezone ?? null } : {}),
      ...(payload.appRole !== undefined ? { appRole: payload.appRole } : {}),
      ...(payload.isActive !== undefined
        ? { deactivatedAt: payload.isActive ? null : new Date() }
        : {}),
    });

    return toUserAdminItem(user);
  }

  async resetPassword(userId: number, input: AdminUserPasswordInput) {
    await this.getAdminContext();
    const payload = adminUserPasswordSchema.parse(input);
    const targetUser = await this.repository.findById(userId);

    if (!targetUser) {
      throw new NotFoundError("User not found.", "user_not_found");
    }

    const user = await this.repository.updateById(userId, {
      passwordHash: hashPassword(payload.password),
      sessionVersion: {
        increment: 1,
      },
    });

    return toUserAdminItem(user);
  }

  async deactivateUser(userId: number) {
    const context = await this.getAdminContext();
    const targetUser = await this.repository.findById(userId);

    if (!targetUser) {
      throw new NotFoundError("User not found.", "user_not_found");
    }

    if (context.actorUserId === userId) {
      throw new ValidationError("You cannot deactivate your own account.", "user_self_deactivate");
    }

    await this.assertCanRemoveActiveAdmin(targetUser);

    const user = await this.repository.updateById(userId, {
      deactivatedAt: targetUser.deactivatedAt ?? new Date(),
    });

    return toUserAdminItem(user);
  }
}
