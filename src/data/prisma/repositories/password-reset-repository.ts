import type { Prisma, PrismaClient } from "@/generated/prisma/client";

const resetUserSelect = {
  id: true,
  name: true,
  email: true,
  deactivatedAt: true,
} as const;

export type PasswordResetUserRecord = {
  id: number;
  name: string;
  email: string;
  deactivatedAt: Date | null;
};

export class PasswordResetRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: resetUserSelect,
    });
  }

  findUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: resetUserSelect,
    });
  }

  createToken(data: Prisma.PasswordResetTokenUncheckedCreateInput) {
    return this.prisma.passwordResetToken.create({
      data,
    });
  }

  async consumeTokenAndUpdatePassword(input: {
    tokenHash: string;
    passwordHash: string;
    now: Date;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const token = await tx.passwordResetToken.findUnique({
        where: { tokenHash: input.tokenHash },
        include: {
          user: {
            select: {
              id: true,
              deactivatedAt: true,
            },
          },
        },
      });

      if (
        !token ||
        token.usedAt ||
        token.expiresAt <= input.now ||
        token.user.deactivatedAt !== null
      ) {
        return null;
      }

      const updatedToken = await tx.passwordResetToken.updateMany({
        where: {
          id: token.id,
          usedAt: null,
        },
        data: {
          usedAt: input.now,
        },
      });

      if (updatedToken.count !== 1) {
        return null;
      }

      await tx.user.update({
        where: { id: token.userId },
        data: {
          passwordHash: input.passwordHash,
          sessionVersion: {
            increment: 1,
          },
        },
      });

      await tx.passwordResetToken.updateMany({
        where: {
          userId: token.userId,
          usedAt: null,
        },
        data: {
          usedAt: input.now,
        },
      });

      return { userId: token.userId };
    });
  }
}
