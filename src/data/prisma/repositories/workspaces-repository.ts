import type { Prisma, PrismaClient } from "@/generated/prisma/client";

const workspaceMemberOrderBy: Prisma.WorkspaceMemberOrderByWithRelationInput[] = [
  { role: "desc" },
  { user: { name: "asc" } },
  { user: { email: "asc" } },
];

const workspaceAdminInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
      deactivatedAt: true,
    },
  },
  memberships: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          deactivatedAt: true,
        },
      },
    },
    orderBy: workspaceMemberOrderBy,
  },
  _count: {
    select: {
      projects: true,
      cycles: true,
      labels: true,
      repeatRules: true,
    },
  },
} satisfies Prisma.WorkspaceInclude;

export type WorkspaceAdminRecord = Prisma.WorkspaceGetPayload<{
  include: typeof workspaceAdminInclude;
}>;

export class WorkspacesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  slugExists(slug: string) {
    return this.prisma.workspace
      .findUnique({
        where: { slug },
        select: { id: true },
      })
      .then(Boolean);
  }

  listWorkspaces(input: {
    query?: string;
    isAppAdmin: boolean;
    visibleWorkspaceIds: number[];
  }) {
    const query = input.query?.trim() ?? "";
    const numericId = Number.parseInt(query, 10);
    const canSearchId = query !== "" && Number.isInteger(numericId) && String(numericId) === query;
    const where: Prisma.WorkspaceWhereInput = {
      ...(input.isAppAdmin ? {} : { id: { in: input.visibleWorkspaceIds } }),
      ...(query
        ? {
            OR: [
              ...(canSearchId ? [{ id: numericId }] : []),
              { name: { contains: query, mode: "insensitive" } },
              { slug: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    if (!input.isAppAdmin && input.visibleWorkspaceIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.workspace.findMany({
      where,
      include: workspaceAdminInclude,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
    });
  }

  findById(id: number) {
    return this.prisma.workspace.findUnique({
      where: { id },
      include: workspaceAdminInclude,
    });
  }

  maxSortOrder() {
    return this.prisma.workspace.aggregate({
      _max: { sortOrder: true },
    });
  }

  listWorkspacesForReorder(input: {
    isAppAdmin: boolean;
    visibleWorkspaceIds: number[];
  }) {
    if (!input.isAppAdmin && input.visibleWorkspaceIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.workspace.findMany({
      where: input.isAppAdmin ? {} : { id: { in: input.visibleWorkspaceIds } },
      include: workspaceAdminInclude,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
    });
  }

  updateWorkspaceSortOrders(updates: Array<{ id: number; sortOrder: number }>) {
    return this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.workspace.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        }),
      ),
    );
  }

  findActiveUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        deactivatedAt: true,
      },
    });
  }

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        deactivatedAt: true,
      },
    });
  }

  listActiveUserCandidates(input: { query?: string; limit?: number }) {
    const query = input.query?.trim() ?? "";
    const numericId = Number.parseInt(query, 10);
    const canSearchId = query !== "" && Number.isInteger(numericId) && String(numericId) === query;

    return this.prisma.user.findMany({
      where: {
        deactivatedAt: null,
        ...(query
          ? {
              OR: [
                ...(canSearchId ? [{ id: numericId }] : []),
                { email: { contains: query, mode: "insensitive" } },
                { name: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: [{ name: "asc" }, { email: "asc" }, { id: "asc" }],
      take: input.limit ?? 50,
    });
  }

  createWithOwner(data: {
    ownerUserId: number;
    name: string;
    description: string | null;
    slug: string;
    sortOrder: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          ownerUserId: data.ownerUserId,
          name: data.name,
          description: data.description,
          slug: data.slug,
          sortOrder: data.sortOrder,
        },
        include: workspaceAdminInclude,
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: data.ownerUserId,
          role: "owner",
        },
      });

      return tx.workspace.findUniqueOrThrow({
        where: { id: workspace.id },
        include: workspaceAdminInclude,
      });
    });
  }

  updateById(id: number, data: Prisma.WorkspaceUncheckedUpdateInput) {
    return this.prisma.workspace.update({
      where: { id },
      data,
      include: workspaceAdminInclude,
    });
  }

  findMembership(workspaceId: number, userId: number) {
    return this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            deactivatedAt: true,
          },
        },
      },
    });
  }

  addMember(workspaceId: number, userId: number, role: string) {
    return this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role,
      },
    });
  }

  createUserWithPersonalWorkspaceAndWorkspaceMembership(data: {
    user: Prisma.UserUncheckedCreateInput;
    personalWorkspace: {
      name: string;
      slug: string;
    };
    workspaceMembership: {
      workspaceId: number;
      role: string;
    };
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: data.user,
        select: {
          id: true,
          name: true,
          email: true,
          deactivatedAt: true,
        },
      });

      const aggregate = await tx.workspace.aggregate({
        _max: { sortOrder: true },
      });
      const personalWorkspace = await tx.workspace.create({
        data: {
          ownerUserId: user.id,
          name: data.personalWorkspace.name,
          slug: data.personalWorkspace.slug,
          sortOrder: (aggregate._max.sortOrder ?? 0) + 1,
        },
        select: { id: true },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: personalWorkspace.id,
          userId: user.id,
          role: "owner",
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: data.workspaceMembership.workspaceId,
          userId: user.id,
          role: data.workspaceMembership.role,
        },
      });

      return user;
    });
  }

  updateMemberRole(workspaceId: number, userId: number, role: string) {
    return this.prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      data: { role },
    });
  }

  removeMember(workspaceId: number, userId: number) {
    return this.prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });
  }

  countActiveOwners(workspaceId: number) {
    return this.prisma.workspaceMember.count({
      where: {
        workspaceId,
        role: "owner",
        user: {
          deactivatedAt: null,
        },
      },
    });
  }

  countUserWorkspaceMemberships(userId: number) {
    return this.prisma.workspaceMember.count({
      where: { userId },
    });
  }

  countUserProjectMembershipsInWorkspace(workspaceId: number, userId: number) {
    return this.prisma.projectMember.count({
      where: {
        userId,
        project: {
          workspaceId,
        },
      },
    });
  }

  findMemberAccessDetails(input: {
    userId: number;
    isAppAdmin: boolean;
    visibleWorkspaceIds: number[];
  }) {
    const workspaceWhere: Prisma.WorkspaceMemberWhereInput = input.isAppAdmin
      ? {}
      : { workspaceId: { in: input.visibleWorkspaceIds } };
    const projectWhere: Prisma.ProjectMemberWhereInput = input.isAppAdmin
      ? {}
      : {
          project: {
            workspaceId: {
              in: input.visibleWorkspaceIds,
            },
          },
        };

    return this.prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        name: true,
        email: true,
        timezone: true,
        appRole: true,
        deactivatedAt: true,
        memberships: {
          where: workspaceWhere,
          select: {
            workspaceId: true,
            role: true,
            createdAt: true,
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          orderBy: [
            { workspace: { sortOrder: "asc" } },
            { workspace: { name: "asc" } },
            { workspaceId: "asc" },
          ],
        },
        projectMemberships: {
          where: projectWhere,
          select: {
            projectId: true,
            role: true,
            createdAt: true,
            project: {
              select: {
                id: true,
                name: true,
                workspaceId: true,
                workspace: {
                  select: {
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
          orderBy: [{ project: { name: "asc" } }, { projectId: "asc" }],
        },
      },
    });
  }

  findMembersWithOnlyThisWorkspace(workspaceId: number) {
    return this.prisma.user.findMany({
      where: {
        memberships: {
          some: {
            workspaceId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            memberships: true,
          },
        },
      },
    });
  }

  deleteEmptyWorkspace(id: number) {
    return this.prisma.workspace.delete({
      where: { id },
      include: workspaceAdminInclude,
    });
  }
}
