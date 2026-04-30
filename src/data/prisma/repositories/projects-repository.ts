import type { PrismaClient } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";

const projectMemberOrderBy: Prisma.ProjectMemberOrderByWithRelationInput[] = [
  { role: "desc" },
  { user: { name: "asc" } },
  { user: { email: "asc" } },
];

export class ProjectsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private readonly projectInclude = {
    workspace: true,
    _count: {
      select: {
        tasks: true,
      },
    },
  } as const;

  private readonly projectMemberInclude = {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        deactivatedAt: true,
      },
    },
  } as const;

  listProjectsByIds(projectIds: number[], includeArchived = true) {
    if (projectIds.length === 0) {
      return Promise.resolve([]);
    }

    if (!includeArchived) {
      return this.prisma.project.findMany({
        where: { id: { in: projectIds }, archivedAt: null },
        orderBy: [{ workspaceId: "asc" }, { sortOrder: "asc" }],
        include: this.projectInclude,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const [active, archived] = await Promise.all([
        tx.project.findMany({
          where: { id: { in: projectIds }, archivedAt: null },
          orderBy: [{ workspaceId: "asc" }, { sortOrder: "asc" }],
          include: this.projectInclude,
        }),
        tx.project.findMany({
          where: { id: { in: projectIds }, archivedAt: { not: null } },
          orderBy: [{ workspaceId: "asc" }, { sortOrder: "asc" }],
          include: this.projectInclude,
        }),
      ]);

      return [...active, ...archived];
    });
  }

  findById(id: number) {
    return this.prisma.project.findUnique({
      where: { id },
      include: this.projectInclude,
    });
  }

  findByIdForMembers(id: number) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        workspace: true,
        members: {
          include: this.projectMemberInclude,
          orderBy: projectMemberOrderBy,
        },
      },
    });
  }

  maxActiveSortOrder(workspaceId: number) {
    return this.prisma.project.aggregate({
      where: { workspaceId, archivedAt: null },
      _max: { sortOrder: true },
    });
  }

  listActiveProjectsForReorder(workspaceId: number, accessibleProjectIds: number[]) {
    if (accessibleProjectIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.project.findMany({
      where: { id: { in: accessibleProjectIds }, workspaceId, archivedAt: null },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: this.projectInclude,
    });
  }

  findAdjacentActiveProject(
    workspaceId: number,
    sortOrder: number,
    direction: "up" | "down",
    accessibleProjectIds: number[],
  ) {
    if (accessibleProjectIds.length === 0) {
      return Promise.resolve(null);
    }

    return this.prisma.project.findFirst({
      where:
        direction === "up"
          ? {
              id: { in: accessibleProjectIds },
              workspaceId,
              archivedAt: null,
              sortOrder: {
                lt: sortOrder,
              },
            }
          : {
              id: { in: accessibleProjectIds },
              workspaceId,
              archivedAt: null,
              sortOrder: {
                gt: sortOrder,
              },
            },
      orderBy: {
        sortOrder: direction === "up" ? "desc" : "asc",
      },
      include: this.projectInclude,
    });
  }

  updateProjectSortOrders(updates: Array<{ id: number; sortOrder: number }>) {
    return this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.project.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        }),
      ),
    );
  }

  swapSortOrders(
    currentProjectId: number,
    currentSortOrder: number,
    targetProjectId: number,
    targetSortOrder: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: currentProjectId },
        data: { sortOrder: targetSortOrder },
      });

      await tx.project.update({
        where: { id: targetProjectId },
        data: { sortOrder: currentSortOrder },
      });

      return tx.project.findUnique({
        where: { id: currentProjectId },
        include: this.projectInclude,
      });
    });
  }

  createWithOwnerMember(data: Prisma.ProjectUncheckedCreateInput, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data,
        include: this.projectInclude,
      });

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId,
          role: "owner",
        },
      });

      return project;
    });
  }

  updateById(id: number, data: Prisma.ProjectUncheckedUpdateInput) {
    return this.prisma.project.update({
      where: { id },
      data,
      include: this.projectInclude,
    });
  }

  listActiveWorkspaceMemberCandidates(input: {
    workspaceId: number;
    excludedUserIds: number[];
  }) {
    return this.prisma.user.findMany({
      where: {
        deactivatedAt: null,
        memberships: {
          some: {
            workspaceId: input.workspaceId,
          },
        },
        ...(input.excludedUserIds.length > 0
          ? { id: { notIn: input.excludedUserIds } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: [{ name: "asc" }, { email: "asc" }, { id: "asc" }],
    });
  }

  findActiveWorkspaceMemberUser(workspaceId: number, userId: number) {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        deactivatedAt: null,
        memberships: {
          some: {
            workspaceId,
          },
        },
      },
      select: {
        id: true,
      },
    });
  }

  findProjectMember(projectId: number, userId: number) {
    return this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      include: this.projectMemberInclude,
    });
  }

  addProjectMember(projectId: number, userId: number, role: string) {
    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role,
      },
    });
  }

  updateProjectMemberRole(projectId: number, userId: number, role: string) {
    return this.prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      data: { role },
    });
  }

  removeProjectMember(projectId: number, userId: number) {
    return this.prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });
  }

  countActiveProjectOwners(projectId: number) {
    return this.prisma.projectMember.count({
      where: {
        projectId,
        role: "owner",
        user: {
          deactivatedAt: null,
        },
      },
    });
  }
}
