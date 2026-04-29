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

  updateById(id: number, data: Prisma.UserUncheckedUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  }
}
