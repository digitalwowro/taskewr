import type { PrismaClient } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";

export class ProjectsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listProjects(workspaceId: number, includeArchived = true) {
    const include = {
      _count: {
        select: {
          tasks: true,
        },
      },
    } as const;

    if (!includeArchived) {
      return this.prisma.project.findMany({
        where: { workspaceId, archivedAt: null },
        orderBy: [{ sortOrder: "asc" }],
        include,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const [active, archived] = await Promise.all([
        tx.project.findMany({
          where: { workspaceId, archivedAt: null },
          orderBy: [{ sortOrder: "asc" }],
          include,
        }),
        tx.project.findMany({
          where: { workspaceId, archivedAt: { not: null } },
          orderBy: [{ sortOrder: "asc" }],
          include,
        }),
      ]);

      return [...active, ...archived];
    });
  }

  findById(id: number) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tasks: true,
          },
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

  findAdjacentActiveProject(
    workspaceId: number,
    sortOrder: number,
    direction: "up" | "down",
  ) {
    return this.prisma.project.findFirst({
      where:
        direction === "up"
          ? {
              workspaceId,
              archivedAt: null,
              sortOrder: {
                lt: sortOrder,
              },
            }
          : {
              workspaceId,
              archivedAt: null,
              sortOrder: {
                gt: sortOrder,
              },
            },
      orderBy: {
        sortOrder: direction === "up" ? "desc" : "asc",
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
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
        include: {
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });
    });
  }

  create(data: Prisma.ProjectUncheckedCreateInput) {
    return this.prisma.project.create({
      data,
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });
  }

  updateById(id: number, data: Prisma.ProjectUncheckedUpdateInput) {
    return this.prisma.project.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });
  }
}
