import {
  assertCanDeleteWorkspace,
  assertCanListWorkspaceAdmin,
  assertCanManageWorkspace,
  assertCanManageWorkspaceOwners,
  assertCanViewWorkspaceAdmin,
  canDeleteWorkspace,
  canManageWorkspace,
  canManageWorkspaceOwners,
} from "@/domain/auth/policies";
import { AuthorizationError, NotFoundError, ValidationError } from "@/domain/common/errors";
import {
  workspaceListQuerySchema,
  workspaceMemberCreateSchema,
  workspaceMemberNewUserSchema,
  workspaceMemberUpdateSchema,
  workspaceMutationSchema,
  type WorkspaceListQueryInput,
  type WorkspaceMemberCreateInput,
  type WorkspaceMemberNewUserInput,
  type WorkspaceMemberUpdateInput,
  type WorkspaceMutationInput,
} from "@/domain/workspaces/schemas";
import { personalWorkspaceName, slugifyWorkspaceName } from "@/domain/workspaces/slug";
import {
  WorkspacesRepository,
  type WorkspaceAdminRecord,
} from "@/data/prisma/repositories/workspaces-repository";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { AppContextService, type AppContext } from "@/server/services/app-context-service";

export type WorkspaceAdminMemberItem = {
  userId: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  joinedAt: Date;
};

export type WorkspaceAdminItem = {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  ownerUserId: number | null;
  ownerName: string | null;
  actorCanManage: boolean;
  actorCanManageOwners: boolean;
  actorCanDelete: boolean;
  canDelete: boolean;
  memberCount: number;
  activeMemberCount: number;
  projectCount: number;
  cycleCount: number;
  labelCount: number;
  repeatRuleCount: number;
  createdAt: Date;
  updatedAt: Date;
  members: WorkspaceAdminMemberItem[];
};

export type WorkspaceUserCandidate = {
  id: number;
  name: string;
  email: string;
};

export type WorkspaceMemberAccessDetails = {
  userId: number;
  name: string;
  email: string;
  timezone: string | null;
  appRole: string;
  isActive: boolean;
  overviewScope: "all" | "managed";
  currentWorkspace: {
    id: number;
    name: string;
    role: string;
    actorCanManageOwners: boolean;
  };
  workspaces: {
    id: number;
    name: string;
    slug: string;
    role: string;
    isCurrent: boolean;
    joinedAt: Date;
  }[];
  projects: {
    id: number;
    name: string;
    workspaceId: number | null;
    workspaceName: string;
    role: string;
    joinedAt: Date;
  }[];
};

type WorkspacePolicyActor = {
  appRole: string;
  workspaceMemberships: {
    workspaceId: number;
    workspaceName: string;
    workspaceSlug: string;
    role: string;
  }[];
};

function toPolicyActor(context: AppContext): WorkspacePolicyActor {
  return {
    appRole: context.appRole,
    workspaceMemberships: context.workspaces.map((workspace) => ({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      role: workspace.role,
    })),
  };
}

function toWorkspaceAdminItem(
  workspace: WorkspaceAdminRecord,
  actor: WorkspacePolicyActor,
): WorkspaceAdminItem {
  const activeMembers = workspace.memberships.filter((membership) => !membership.user.deactivatedAt);
  const projectCount = workspace._count.projects;
  const cycleCount = workspace._count.cycles;
  const labelCount = workspace._count.labels;
  const repeatRuleCount = workspace._count.repeatRules;

  return {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    slug: workspace.slug,
    ownerUserId: workspace.ownerUserId,
    ownerName: workspace.owner?.name ?? null,
    actorCanManage: canManageWorkspace(actor, workspace.id),
    actorCanManageOwners: canManageWorkspaceOwners(actor, workspace.id),
    actorCanDelete: canDeleteWorkspace(actor, workspace.id),
    canDelete: projectCount + cycleCount + labelCount + repeatRuleCount === 0,
    memberCount: workspace.memberships.length,
    activeMemberCount: activeMembers.length,
    projectCount,
    cycleCount,
    labelCount,
    repeatRuleCount,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
    members: workspace.memberships.map((membership) => ({
      userId: membership.userId,
      name: membership.user.name,
      email: membership.user.email,
      role: membership.role,
      isActive: membership.user.deactivatedAt === null,
      joinedAt: membership.createdAt,
    })),
  };
}

export class WorkspaceAdminService {
  constructor(
    private readonly repository = new WorkspacesRepository(db),
    private readonly contextService = new AppContextService(),
  ) {}

  private async getContext() {
    const context = await this.contextService.getAppContext();
    const actor = toPolicyActor(context);

    return { context, actor };
  }

  private async getVisibleWorkspace(workspaceId: number) {
    const { context, actor } = await this.getContext();
    const workspace = await this.repository.findById(workspaceId);

    if (!workspace) {
      throw new NotFoundError("Workspace not found.", "workspace_not_found");
    }

    assertCanViewWorkspaceAdmin(actor, workspaceId);

    return { context, workspace, actor };
  }

  private async getManagedWorkspace(workspaceId: number) {
    const result = await this.getVisibleWorkspace(workspaceId);
    assertCanManageWorkspace(result.actor, workspaceId);

    return result;
  }

  private async getOwnerManagedWorkspace(workspaceId: number) {
    const result = await this.getVisibleWorkspace(workspaceId);
    assertCanManageWorkspaceOwners(result.actor, workspaceId);

    return result;
  }

  private async generateUniqueWorkspaceSlug(name: string) {
    const baseSlug = slugifyWorkspaceName(name);
    let candidate = baseSlug;
    let suffix = 2;

    while (await this.repository.slugExists(candidate)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private getManageableWorkspaceIds(context: AppContext) {
    return context.workspaces
      .filter((workspace) => workspace.role === "owner" || workspace.role === "admin")
      .map((workspace) => workspace.id);
  }

  private assertCanAssignWorkspaceRole(
    actor: WorkspacePolicyActor,
    workspaceId: number,
    role: string,
  ) {
    if (role === "owner") {
      assertCanManageWorkspaceOwners(actor, workspaceId);
      return;
    }

    assertCanManageWorkspace(actor, workspaceId);
  }

  private async assertCanRemoveOrDemoteOwner(workspaceId: number, userId: number, nextRole?: string) {
    const membership = await this.repository.findMembership(workspaceId, userId);

    if (!membership) {
      throw new NotFoundError("Workspace member not found.", "workspace_member_not_found");
    }

    if (membership.role !== "owner" || nextRole === "owner" || membership.user.deactivatedAt) {
      return membership;
    }

    const ownerCount = await this.repository.countActiveOwners(workspaceId);

    if (ownerCount <= 1) {
      throw new ValidationError(
        "At least one active workspace owner is required.",
        "workspace_last_owner",
      );
    }

    return membership;
  }

  async listWorkspaces(input: WorkspaceListQueryInput = {}) {
    const { context, actor } = await this.getContext();
    assertCanListWorkspaceAdmin(actor);
    const payload = workspaceListQuerySchema.parse(input);
    const workspaces = await this.repository.listWorkspaces({
      query: payload.query,
      isAppAdmin: context.appRole === "admin",
      visibleWorkspaceIds: context.accessibleWorkspaceIds,
    });

    return workspaces.map((workspace) => toWorkspaceAdminItem(workspace, actor));
  }

  async listUserCandidates(input: { query?: string } = {}): Promise<WorkspaceUserCandidate[]> {
    const { actor } = await this.getContext();
    if (
      actor.appRole !== "admin" &&
      !actor.workspaceMemberships.some(
        (membership) => membership.role === "owner" || membership.role === "admin",
      )
    ) {
      throw new AuthorizationError(
        "Only workspace managers can list users.",
        "workspace_user_candidates_denied",
      );
    }
    const query = input.query?.trim() ?? "";

    return this.repository.listActiveUserCandidates({
      query,
      limit: 50,
    });
  }

  async getMemberDetails(
    workspaceId: number,
    userId: number,
  ): Promise<WorkspaceMemberAccessDetails> {
    const { context, workspace, actor } = await this.getManagedWorkspace(workspaceId);
    const membership = await this.repository.findMembership(workspaceId, userId);

    if (!membership) {
      throw new NotFoundError("Workspace member not found.", "workspace_member_not_found");
    }

    const accessDetails = await this.repository.findMemberAccessDetails({
      userId,
      isAppAdmin: context.appRole === "admin",
      visibleWorkspaceIds: this.getManageableWorkspaceIds(context),
    });

    if (!accessDetails) {
      throw new NotFoundError("User not found.", "user_not_found");
    }

    return {
      userId: accessDetails.id,
      name: accessDetails.name,
      email: accessDetails.email,
      timezone: accessDetails.timezone,
      appRole: accessDetails.appRole,
      isActive: accessDetails.deactivatedAt === null,
      overviewScope: context.appRole === "admin" ? "all" : "managed",
      currentWorkspace: {
        id: workspaceId,
        name: workspace.name,
        role: membership.role,
        actorCanManageOwners: canManageWorkspaceOwners(actor, workspaceId),
      },
      workspaces: accessDetails.memberships.map((item) => ({
        id: item.workspace.id,
        name: item.workspace.name,
        slug: item.workspace.slug,
        role: item.role,
        isCurrent: item.workspaceId === workspaceId,
        joinedAt: item.createdAt,
      })),
      projects: accessDetails.projectMemberships.map((item) => ({
        id: item.project.id,
        name: item.project.name,
        workspaceId: item.project.workspaceId,
        workspaceName: item.project.workspace?.name ?? "No workspace",
        role: item.role,
        joinedAt: item.createdAt,
      })),
    };
  }

  async createWorkspace(input: WorkspaceMutationInput) {
    const { context, actor } = await this.getContext();
    const payload = workspaceMutationSchema.parse(input);
    const ownerUserId =
      context.appRole === "admin" && payload.ownerUserId ? payload.ownerUserId : context.actorUserId;
    const owner = await this.repository.findActiveUserById(ownerUserId);

    if (!owner || owner.deactivatedAt) {
      throw new ValidationError("Workspace owner must be an active user.", "workspace_owner_invalid");
    }

    const slug = await this.generateUniqueWorkspaceSlug(payload.name);
    const workspace = await this.repository.createWithOwner({
      ownerUserId,
      name: payload.name,
      description: payload.description ?? null,
      slug,
    });
    const actorAlreadyHasMembership = actor.workspaceMemberships.some(
      (membership) => membership.workspaceId === workspace.id,
    );
    const nextActor = {
      ...actor,
      workspaceMemberships:
        ownerUserId === context.actorUserId && !actorAlreadyHasMembership
          ? [
              ...actor.workspaceMemberships,
              {
                workspaceId: workspace.id,
                workspaceName: workspace.name,
                workspaceSlug: workspace.slug,
                role: "owner",
              },
            ]
          : actor.workspaceMemberships,
    };

    return toWorkspaceAdminItem(workspace, nextActor);
  }

  async updateWorkspace(workspaceId: number, input: WorkspaceMutationInput) {
    const { actor } = await this.getManagedWorkspace(workspaceId);
    const payload = workspaceMutationSchema.parse(input);
    const workspace = await this.repository.updateById(workspaceId, {
      name: payload.name,
      description: payload.description ?? null,
    });

    return toWorkspaceAdminItem(workspace, actor);
  }

  async deleteWorkspace(workspaceId: number) {
    const { workspace, actor } = await this.getOwnerManagedWorkspace(workspaceId);
    assertCanDeleteWorkspace(actor, workspaceId);
    const nonMembershipCount =
      workspace._count.projects +
      workspace._count.cycles +
      workspace._count.labels +
      workspace._count.repeatRules;

    if (nonMembershipCount > 0) {
      throw new ValidationError(
        "Only empty workspaces can be deleted.",
        "workspace_not_empty",
      );
    }

    const usersWithOnlyThisWorkspace =
      await this.repository.findMembersWithOnlyThisWorkspace(workspaceId);
    const blockedUser = usersWithOnlyThisWorkspace.find(
      (user) => user._count.memberships <= 1,
    );

    if (blockedUser) {
      throw new ValidationError(
        `${blockedUser.name} needs another workspace before this workspace can be deleted.`,
        "workspace_user_last_membership",
      );
    }

    await this.repository.deleteEmptyWorkspace(workspaceId);

    return { id: workspaceId };
  }

  async addMember(workspaceId: number, input: WorkspaceMemberCreateInput) {
    const { actor } = await this.getManagedWorkspace(workspaceId);
    const payload = workspaceMemberCreateSchema.parse(input);
    this.assertCanAssignWorkspaceRole(actor, workspaceId, payload.role);
    const user = await this.repository.findActiveUserById(payload.userId);

    if (!user || user.deactivatedAt) {
      throw new ValidationError("Only active users can be added to a workspace.", "workspace_member_inactive");
    }

    const existingMembership = await this.repository.findMembership(workspaceId, payload.userId);

    if (existingMembership) {
      throw new ValidationError("User is already a member of this workspace.", "workspace_member_exists");
    }

    await this.repository.addMember(workspaceId, payload.userId, payload.role);
    const workspace = await this.repository.findById(workspaceId);

    return toWorkspaceAdminItem(workspace!, actor);
  }

  async updateMember(workspaceId: number, userId: number, input: WorkspaceMemberUpdateInput) {
    const { actor } = await this.getManagedWorkspace(workspaceId);
    const payload = workspaceMemberUpdateSchema.parse(input);
    const membership = await this.assertCanRemoveOrDemoteOwner(workspaceId, userId, payload.role);

    if (membership.role === "owner" || payload.role === "owner") {
      assertCanManageWorkspaceOwners(actor, workspaceId);
    }

    await this.repository.updateMemberRole(workspaceId, userId, payload.role);
    const workspace = await this.repository.findById(workspaceId);

    return toWorkspaceAdminItem(workspace!, actor);
  }

  async removeMember(workspaceId: number, userId: number) {
    const { actor } = await this.getManagedWorkspace(workspaceId);
    const membership = await this.assertCanRemoveOrDemoteOwner(workspaceId, userId);

    if (membership.role === "owner") {
      assertCanManageWorkspaceOwners(actor, workspaceId);
    }

    const projectMemberships =
      await this.repository.countUserProjectMembershipsInWorkspace(workspaceId, userId);

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

    await this.repository.removeMember(workspaceId, userId);
    const workspace = await this.repository.findById(workspaceId);

    return toWorkspaceAdminItem(workspace!, actor);
  }

  async createAndAddMember(workspaceId: number, input: WorkspaceMemberNewUserInput) {
    const { actor } = await this.getManagedWorkspace(workspaceId);
    const payload = workspaceMemberNewUserSchema.parse(input);
    this.assertCanAssignWorkspaceRole(actor, workspaceId, payload.role);

    const existingUser = await this.repository.findUserByEmail(payload.email);

    if (existingUser) {
      throw new ValidationError("Email address is already in use.", "user_email_taken");
    }

    const workspaceName = personalWorkspaceName({
      name: payload.name,
      email: payload.email,
    });
    const workspaceSlug = await this.generateUniqueWorkspaceSlug(workspaceName);

    await this.repository.createUserWithPersonalWorkspaceAndWorkspaceMembership({
      user: {
        name: payload.name,
        email: payload.email,
        passwordHash: hashPassword(payload.password),
        timezone: payload.timezone ?? null,
        appRole: "user",
      },
      personalWorkspace: {
        name: workspaceName,
        slug: workspaceSlug,
      },
      workspaceMembership: {
        workspaceId,
        role: payload.role,
      },
    });
    const workspace = await this.repository.findById(workspaceId);

    return toWorkspaceAdminItem(workspace!, actor);
  }
}
