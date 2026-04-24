import { ProjectsRepository } from "@/data/prisma/repositories/projects-repository";
import { assertCanAccessProject } from "@/domain/auth/policies";
import {
  assertProjectCanArchive,
  assertProjectCanUnarchive,
  nextUnarchivedSortOrder,
} from "@/domain/projects/archive";
import {
  assertProjectMoveTargetExists,
  swapSortOrders,
} from "@/domain/projects/ordering";
import {
  projectMoveSchema,
  projectMutationSchema,
  type ProjectMoveInput,
  type ProjectMutationInput,
} from "@/domain/projects/schemas";
import { NotFoundError, ValidationError } from "@/domain/common/errors";
import { AppContextService } from "@/server/services/app-context-service";
import { db } from "@/lib/db";

export class ProjectService {
  constructor(
    private readonly repository = new ProjectsRepository(db),
    private readonly contextService = new AppContextService(),
  ) {}

  async listProjects(includeArchived = true) {
    const context = await this.contextService.getAppContext();
    return this.repository.listProjects(context.workspaceId, includeArchived);
  }

  async getProject(id: number) {
    const context = await this.contextService.getAppContext();
    const project = await this.repository.findById(id);

    if (!project) {
      throw new NotFoundError("Project not found.", "project_not_found");
    }

    assertCanAccessProject(
      {
        userId: context.actorUserId ?? 0,
        workspaceId: context.workspaceId,
        workspaceRole: "owner",
        timezone: context.timezone,
      },
      { workspaceId: project.workspaceId ?? context.workspaceId },
    );

    return project;
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
    const context = await this.contextService.getAppContext();

    assertProjectCanUnarchive(project.archivedAt !== null);

    const aggregate = await this.repository.maxActiveSortOrder(context.workspaceId);

    return {
      id: project.id,
      archivedAt: null,
      sortOrder: nextUnarchivedSortOrder(aggregate._max.sortOrder ?? null),
    };
  }

  async createProject(input: ProjectMutationInput) {
    const payload = projectMutationSchema.parse(input);
    const context = await this.contextService.getAppContext();
    const aggregate = await this.repository.maxActiveSortOrder(context.workspaceId);

    return this.repository.create({
      workspaceId: context.workspaceId,
      ownerUserId: context.actorUserId,
      name: payload.name,
      description: payload.description || null,
      sortOrder: nextUnarchivedSortOrder(aggregate._max.sortOrder ?? null),
    });
  }

  async updateProject(id: number, input: ProjectMutationInput) {
    await this.getProject(id);
    const payload = projectMutationSchema.parse(input);

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
    const project = await this.getProject(id);

    if (project.archivedAt !== null) {
      throw new ValidationError(
        "Archived projects cannot be reordered.",
        "project_move_archived",
      );
    }

    const targetProject = await this.repository.findAdjacentActiveProject(
      project.workspaceId ?? 0,
      project.sortOrder,
      payload.direction,
    );

    assertProjectMoveTargetExists(targetProject?.sortOrder ?? null);

    const nextSortOrders = swapSortOrders(project.sortOrder, targetProject!.sortOrder);

    return this.repository.swapSortOrders(
      project.id,
      nextSortOrders.currentSortOrder,
      targetProject!.id,
      nextSortOrders.targetSortOrder,
    );
  }
}
