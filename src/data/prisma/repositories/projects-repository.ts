import type { PrismaClient } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";

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

  maxActiveSortOrder(workspaceId: number) {
    return this.prisma.project.aggregate({
      where: { workspaceId, archivedAt: null },
      _max: { sortOrder: true },
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
}
