import type { Prisma, PrismaClient } from "@/generated/prisma/client";

export type UserAdminRecord = {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  timezone: string | null;
  appRole: string;
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserProjectAccessRecord = {
  id: number;
  name: string;
  email: string;
  memberships: {
    role: string;
    workspace: {
      id: number;
      name: string;
      slug: string;
      projects: {
        id: number;
        name: string;
        archivedAt: Date | null;
      }[];
    };
  }[];
  projectMemberships: {
    role: string;
    project: {
      id: number;
      name: string;
      workspaceId: number | null;
      archivedAt: Date | null;
    };
  }[];
};

export type UserAvailableWorkspaceRecord = {
  id: number;
  name: string;
  slug: string;
};

export type UserProjectMembershipRecord = {
  role: string;
  user: {
    deactivatedAt: Date | null;
  };
};

export type UserWorkspaceMembershipRecord = {
  role: string;
  user: {
    deactivatedAt: Date | null;
  };
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  timezone: true,
  appRole: true,
  deactivatedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class UsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listUsers(input: { query?: string; includeInactive?: boolean }) {
    const query = input.query?.trim() ?? "";
    const numericId = Number.parseInt(query, 10);
    const canSearchId = query !== "" && Number.isInteger(numericId) && String(numericId) === query;
    const where: Prisma.UserWhereInput = {
      ...(input.includeInactive ? {} : { deactivatedAt: null }),
      ...(query
        ? {
            OR: [
              ...(canSearchId ? [{ id: numericId }] : []),
              { email: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    return this.prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: [{ name: "asc" }, { email: "asc" }, { id: "asc" }],
    });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: userSelect,
    });
  }

  findProjectAccessById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        memberships: {
          select: {
            role: true,
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
                projects: {
                  where: {
                    members: {
                      none: {
                        userId: id,
                      },
                    },
                  },
                  select: {
                    id: true,
                    name: true,
                    archivedAt: true,
                  },
                  orderBy: [{ name: "asc" }, { id: "asc" }],
                },
              },
            },
          },
          orderBy: {
            workspace: {
              name: "asc",
            },
          },
        },
        projectMemberships: {
          select: {
            role: true,
            project: {
              select: {
                id: true,
                name: true,
                workspaceId: true,
                archivedAt: true,
              },
            },
          },
          orderBy: {
            project: {
              name: "asc",
            },
          },
        },
      },
    });
  }

  listAvailableWorkspacesForUser(userId: number) {
    return this.prisma.workspace.findMany({
      where: {
        memberships: {
          none: {
            userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
    });
  }

  findWorkspaceAvailableToUser(userId: number, workspaceId: number) {
    return this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        memberships: {
          none: {
            userId,
          },
        },
      },
      select: {
        id: true,
      },
    });
  }

  addWorkspaceMembership(userId: number, workspaceId: number, role: string) {
    return this.prisma.workspaceMember.create({
      data: {
        userId,
        workspaceId,
        role,
      },
    });
  }

  findProjectAvailableToUser(userId: number, projectId: number) {
    return this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId: {
          not: null,
        },
        workspace: {
          memberships: {
            some: {
              userId,
            },
          },
        },
        members: {
          none: {
            userId,
          },
        },
      },
      select: {
        id: true,
      },
    });
  }

  addProjectMembership(userId: number, projectId: number, role: string) {
    return this.prisma.projectMember.create({
      data: {
        userId,
        projectId,
        role,
      },
    });
  }

  findWorkspaceMembership(userId: number, workspaceId: number) {
    return this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      select: {
        role: true,
        user: {
          select: {
            deactivatedAt: true,
          },
        },
      },
    });
  }

  countActiveWorkspaceOwners(workspaceId: number) {
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
      where: {
        userId,
      },
    });
  }

  countUserProjectMembershipsInWorkspace(userId: number, workspaceId: number) {
    return this.prisma.projectMember.count({
      where: {
        userId,
        project: {
          workspaceId,
        },
      },
    });
  }

  removeWorkspaceMembership(userId: number, workspaceId: number) {
    return this.prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });
  }

  findProjectMembership(userId: number, projectId: number) {
    return this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      select: {
        role: true,
        user: {
          select: {
            deactivatedAt: true,
          },
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

  removeProjectMembership(userId: number, projectId: number) {
    return this.prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });
  }

  countActiveAdmins() {
    return this.prisma.user.count({
      where: {
        appRole: "admin",
        deactivatedAt: null,
      },
    });
  }

  create(data: Prisma.UserUncheckedCreateInput) {
    return this.prisma.user.create({
      data,
      select: userSelect,
    });
  }

  createWithPersonalWorkspace(
    data: Prisma.UserUncheckedCreateInput,
    workspace: { name: string; slug: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data,
        select: userSelect,
      });

      const aggregate = await tx.workspace.aggregate({
        _max: { sortOrder: true },
      });
      const personalWorkspace = await tx.workspace.create({
        data: {
          ownerUserId: user.id,
          name: workspace.name,
          slug: workspace.slug,
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

      return user;
    });
  }

  workspaceSlugExists(slug: string) {
    return this.prisma.workspace
      .findUnique({
        where: { slug },
        select: { id: true },
      })
      .then(Boolean);
  }

  updateById(id: number, data: Prisma.UserUncheckedUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  }
}
