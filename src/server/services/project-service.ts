import { ProjectsRepository } from "@/data/prisma/repositories/projects-repository";
import {
  assertCanAccessProject,
  assertCanAccessWorkspace,
  requireWorkspaceOwnership,
} from "@/domain/auth/policies";
import {
  assertProjectCanArchive,
  assertProjectCanUnarchive,
  nextUnarchivedSortOrder,
} from "@/domain/projects/archive";
import {
  assertProjectMoveTargetExists,
} from "@/domain/projects/ordering";
import {
  projectMemberCreateSchema,
  projectMemberUpdateSchema,
  projectMoveSchema,
  projectMutationSchema,
  type ProjectMemberCreateInput,
  type ProjectMemberUpdateInput,
  type ProjectMoveInput,
  type ProjectMutationInput,
} from "@/domain/projects/schemas";
import { AuthorizationError, NotFoundError, ValidationError } from "@/domain/common/errors";
import { AppContextService, type AppContext } from "@/server/services/app-context-service";
import { db } from "@/lib/db";

export type ProjectMemberItem = {
  userId: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  joinedAt: Date;
};

export type ProjectMemberCandidate = {
  id: number;
  name: string;
  email: string;
};

export type ProjectMembersDetails = {
  projectId: number;
  projectName: string;
  workspaceId: number | null;
  workspaceName: string;
  actorUserId: number;
  actorRole: string;
  actorCanManage: boolean;
  actorCanManageOwners: boolean;
  members: ProjectMemberItem[];
  candidates: ProjectMemberCandidate[];
};

type ProjectMembersRecord = NonNullable<
  Awaited<ReturnType<ProjectsRepository["findByIdForMembers"]>>
>;

function canManageProjectMembers(role: string | null | undefined) {
  return role === "owner" || role === "admin";
}

function canManageProjectOwners(role: string | null | undefined) {
  return role === "owner";
}

function assertCanManageProjectMembers(role: string | null | undefined) {
  if (!canManageProjectMembers(role)) {
    throw new AuthorizationError(
      "You do not have permission to manage project users.",
      "project_member_management_denied",
    );
  }
}

function assertCanManageProjectOwners(role: string | null | undefined) {
  if (!canManageProjectOwners(role)) {
    throw new AuthorizationError(
      "Only project owners can manage project owners.",
      "project_owner_management_denied",
    );
  }
}

function assertCanAssignProjectRole(actorRole: string | null | undefined, role: string) {
  if (role === "owner") {
    assertCanManageProjectOwners(actorRole);
    return;
  }

  assertCanManageProjectMembers(actorRole);
}

function actorProjectRole(project: ProjectMembersRecord, context: AppContext) {
  return (
    project.members.find((member) => member.userId === context.actorUserId)?.role ??
    null
  );
}

function toProjectMembersDetails(
  project: ProjectMembersRecord,
  context: AppContext,
  candidates: ProjectMemberCandidate[],
): ProjectMembersDetails {
  const role = actorProjectRole(project, context) ?? "member";

  return {
    projectId: project.id,
    projectName: project.name,
    workspaceId: project.workspaceId,
    workspaceName: project.workspace?.name ?? "No workspace",
    actorUserId: context.actorUserId,
    actorRole: role,
    actorCanManage: canManageProjectMembers(role),
    actorCanManageOwners: canManageProjectOwners(role),
    members: project.members.map((member) => ({
      userId: member.userId,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
      isActive: member.user.deactivatedAt === null,
      joinedAt: member.createdAt,
    })),
    candidates,
  };
}

export class ProjectService {
  constructor(
    private readonly repository = new ProjectsRepository(db),
    private readonly contextService = new AppContextService(),
  ) {}

  async listProjects(includeArchived = true) {
    const context = await this.contextService.getAppContext();
    return this.repository.listProjectsByIds(context.accessibleProjectIds, includeArchived);
  }

  async getProject(id: number) {
    const context = await this.contextService.getAppContext();
    const project = await this.repository.findById(id);

    if (!project) {
      throw new NotFoundError("Project not found.", "project_not_found");
    }

    assertCanAccessProject(context, { projectId: project.id });

    return project;
  }

  private async getProjectMembersRecord(id: number) {
    const context = await this.contextService.getAppContext();
    const project = await this.repository.findByIdForMembers(id);

    if (!project) {
      throw new NotFoundError("Project not found.", "project_not_found");
    }

    assertCanAccessProject(context, { projectId: project.id });

    return { context, project };
  }

  async getProjectMembers(id: number) {
    const { context, project } = await this.getProjectMembersRecord(id);
    const workspaceId = requireWorkspaceOwnership(project.workspaceId);
    const candidates = await this.repository.listActiveWorkspaceMemberCandidates({
      workspaceId,
      excludedUserIds: project.members.map((member) => member.userId),
    });

    return toProjectMembersDetails(project, context, candidates);
  }

  async planArchive(id: number) {
    const project = await this.getProject(id);

    assertProjectCanArchive(project.archivedAt !== null);

    return {
      id: project.id,
      archivedAt: new Date(),
    };
  }

  async planUnarchive(id: number) {
    const project = await this.getProject(id);

    assertProjectCanUnarchive(project.archivedAt !== null);

    const aggregate = await this.repository.maxActiveSortOrder(
      requireWorkspaceOwnership(project.workspaceId),
    );

    return {
      id: project.id,
      archivedAt: null,
      sortOrder: nextUnarchivedSortOrder(aggregate._max.sortOrder ?? null),
    };
  }

  async createProject(input: ProjectMutationInput) {
    const payload = projectMutationSchema.parse(input);
    const context = await this.contextService.getAppContext();
    const workspaceId = payload.workspaceId ?? context.workspaceId;

    assertCanAccessWorkspace(context, workspaceId);

    const aggregate = await this.repository.maxActiveSortOrder(workspaceId);

    return this.repository.createWithOwnerMember(
      {
        workspaceId,
        ownerUserId: context.actorUserId,
        name: payload.name,
        description: payload.description || null,
        sortOrder: nextUnarchivedSortOrder(aggregate._max.sortOrder ?? null),
      },
      context.actorUserId,
    );
  }

  async updateProject(id: number, input: ProjectMutationInput) {
    const project = await this.getProject(id);
    const payload = projectMutationSchema.parse(input);

    if (payload.workspaceId && payload.workspaceId !== project.workspaceId) {
      throw new ValidationError(
        "Moving projects between workspaces is not supported yet.",
        "project_workspace_move_not_supported",
      );
    }

    return this.repository.updateById(id, {
      name: payload.name,
      description: payload.description || null,
    });
  }

  async archiveProject(id: number) {
    const plan = await this.planArchive(id);

    return this.repository.updateById(id, {
      archivedAt: plan.archivedAt,
    });
  }

  async unarchiveProject(id: number) {
    const plan = await this.planUnarchive(id);

    return this.repository.updateById(id, {
      archivedAt: plan.archivedAt,
      sortOrder: plan.sortOrder,
    });
  }

  async moveProject(id: number, input: ProjectMoveInput) {
    const payload = projectMoveSchema.parse(input);
    const context = await this.contextService.getAppContext();
    const project = await this.getProject(id);

    if (project.archivedAt !== null) {
      throw new ValidationError(
        "Archived projects cannot be reordered.",
        "project_move_archived",
      );
    }

    const workspaceId = requireWorkspaceOwnership(project.workspaceId);
    const activeProjects = await this.repository.listActiveProjectsForReorder(
      workspaceId,
      context.accessibleProjectIds,
    );
    const currentIndex = activeProjects.findIndex((candidate) => candidate.id === project.id);
    if (currentIndex === -1) {
      assertProjectMoveTargetExists(null);
    }

    const targetIndex = payload.direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const targetProject = activeProjects[targetIndex] ?? null;

    assertProjectMoveTargetExists(targetProject?.sortOrder ?? null);

    const reorderedProjects = [...activeProjects];
    const [movedProject] = reorderedProjects.splice(currentIndex, 1);
    reorderedProjects.splice(targetIndex, 0, movedProject);

    await this.repository.updateProjectSortOrders(
      reorderedProjects.map((candidate, index) => ({
        id: candidate.id,
        sortOrder: index + 1,
      })),
    );

    return this.repository.findById(project.id);
  }

  async addProjectMember(id: number, input: ProjectMemberCreateInput) {
    const { context, project } = await this.getProjectMembersRecord(id);
    const payload = projectMemberCreateSchema.parse(input);
    const actorRole = actorProjectRole(project, context);

    assertCanAssignProjectRole(actorRole, payload.role);
    const workspaceId = requireWorkspaceOwnership(project.workspaceId);
    const workspaceMember = await this.repository.findActiveWorkspaceMemberUser(
      workspaceId,
      payload.userId,
    );

    if (!workspaceMember) {
      throw new ValidationError(
        "User must belong to this project's workspace before they can access the project.",
        "project_member_requires_workspace",
      );
    }

    const existingMember = await this.repository.findProjectMember(id, payload.userId);

    if (existingMember) {
      throw new ValidationError(
        "User is already a member of this project.",
        "project_member_exists",
      );
    }

    await this.repository.addProjectMember(id, payload.userId, payload.role);

    return this.getProjectMembers(id);
  }

  async updateProjectMember(
    id: number,
    userId: number,
    input: ProjectMemberUpdateInput,
  ) {
    const { context, project } = await this.getProjectMembersRecord(id);
    const payload = projectMemberUpdateSchema.parse(input);
    const actorRole = actorProjectRole(project, context);
    const member = await this.repository.findProjectMember(id, userId);

    if (!member) {
      throw new NotFoundError("Project member not found.", "project_member_not_found");
    }

    if (member.role === "owner" || payload.role === "owner") {
      assertCanManageProjectOwners(actorRole);
    } else {
      assertCanManageProjectMembers(actorRole);
    }

    if (member.role === "owner" && payload.role !== "owner" && member.user.deactivatedAt === null) {
      const ownerCount = await this.repository.countActiveProjectOwners(id);

      if (ownerCount <= 1) {
        throw new ValidationError(
          "At least one active project owner is required.",
          "project_last_owner",
        );
      }
    }

    await this.repository.updateProjectMemberRole(id, userId, payload.role);

    return this.getProjectMembers(id);
  }

  async removeProjectMember(id: number, userId: number) {
    const { context, project } = await this.getProjectMembersRecord(id);
    const actorRole = actorProjectRole(project, context);
    const member = await this.repository.findProjectMember(id, userId);

    if (!member) {
      throw new NotFoundError("Project member not found.", "project_member_not_found");
    }

    if (userId === context.actorUserId) {
      throw new ValidationError(
        "You cannot remove yourself from a project.",
        "project_member_self_remove",
      );
    }

    if (member.role === "owner") {
      assertCanManageProjectOwners(actorRole);

      if (member.user.deactivatedAt === null) {
        const ownerCount = await this.repository.countActiveProjectOwners(id);

        if (ownerCount <= 1) {
          throw new ValidationError(
            "At least one active project owner is required.",
            "project_last_owner",
          );
        }
      }
    } else {
      assertCanManageProjectMembers(actorRole);
    }

    await this.repository.removeProjectMember(id, userId);

    return this.getProjectMembers(id);
  }
}
