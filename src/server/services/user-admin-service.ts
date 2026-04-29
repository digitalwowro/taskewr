import { assertCanManageUsers } from "@/domain/auth/policies";
import { NotFoundError, ValidationError } from "@/domain/common/errors";
import {
  adminUserCreateSchema,
  adminUserPasswordSchema,
  adminUserUpdateSchema,
  userListQuerySchema,
  type AdminUserCreateInput,
  type AdminUserPasswordInput,
  type AdminUserUpdateInput,
  type UserListQueryInput,
} from "@/domain/users/schemas";
import { UsersRepository, type UserAdminRecord } from "@/data/prisma/repositories/users-repository";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { AppContextService, type AppContext } from "@/server/services/app-context-service";

export type UserAdminItem = {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  timezone: string | null;
  appRole: string;
  isActive: boolean;
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toUserAdminItem(user: UserAdminRecord): UserAdminItem {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    timezone: user.timezone,
    appRole: user.appRole,
    isActive: user.deactivatedAt === null,
    deactivatedAt: user.deactivatedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class UserAdminService {
  constructor(
    private readonly repository = new UsersRepository(db),
    private readonly contextService = new AppContextService(),
  ) {}

  private async getAdminContext(): Promise<AppContext> {
    const context = await this.contextService.getAppContext();
    assertCanManageUsers({ appRole: context.appRole });
    return context;
  }

  private async assertEmailAvailable(email: string, currentUserId?: number) {
    const existingUser = await this.repository.findByEmail(email);

    if (existingUser && existingUser.id !== currentUserId) {
      throw new ValidationError("Email address is already in use.", "user_email_taken");
    }
  }

  private async assertCanRemoveActiveAdmin(targetUser: UserAdminRecord) {
    if (targetUser.appRole !== "admin" || targetUser.deactivatedAt) {
      return;
    }

    const activeAdminCount = await this.repository.countActiveAdmins();

    if (activeAdminCount <= 1) {
      throw new ValidationError(
        "At least one active app admin is required.",
        "user_last_admin",
      );
    }
  }

  async listUsers(input: UserListQueryInput = {}) {
    await this.getAdminContext();
    const payload = userListQuerySchema.parse(input);
    const users = await this.repository.listUsers(payload);

    return users.map(toUserAdminItem);
  }

  async createUser(input: AdminUserCreateInput) {
    await this.getAdminContext();
    const payload = adminUserCreateSchema.parse(input);
    await this.assertEmailAvailable(payload.email);

    const user = await this.repository.create({
      name: payload.name,
      email: payload.email,
      passwordHash: hashPassword(payload.password),
      timezone: payload.timezone ?? null,
      appRole: payload.appRole,
    });

    return toUserAdminItem(user);
  }

  async updateUser(userId: number, input: AdminUserUpdateInput) {
    const context = await this.getAdminContext();
    const payload = adminUserUpdateSchema.parse(input);
    const targetUser = await this.repository.findById(userId);

    if (!targetUser) {
      throw new NotFoundError("User not found.", "user_not_found");
    }

    if (payload.email) {
      await this.assertEmailAvailable(payload.email, userId);
    }

    if (payload.isActive === false) {
      if (context.actorUserId === userId) {
        throw new ValidationError("You cannot deactivate your own account.", "user_self_deactivate");
      }

      await this.assertCanRemoveActiveAdmin(targetUser);
    }

    if (payload.appRole && payload.appRole !== "admin") {
      await this.assertCanRemoveActiveAdmin(targetUser);
    }

    const user = await this.repository.updateById(userId, {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {}),
      ...(payload.timezone !== undefined ? { timezone: payload.timezone ?? null } : {}),
      ...(payload.appRole !== undefined ? { appRole: payload.appRole } : {}),
      ...(payload.isActive !== undefined
        ? { deactivatedAt: payload.isActive ? null : new Date() }
        : {}),
    });

    return toUserAdminItem(user);
  }

  async resetPassword(userId: number, input: AdminUserPasswordInput) {
    await this.getAdminContext();
    const payload = adminUserPasswordSchema.parse(input);
    const targetUser = await this.repository.findById(userId);

    if (!targetUser) {
      throw new NotFoundError("User not found.", "user_not_found");
    }

    const user = await this.repository.updateById(userId, {
      passwordHash: hashPassword(payload.password),
    });

    return toUserAdminItem(user);
  }

  async deactivateUser(userId: number) {
    const context = await this.getAdminContext();
    const targetUser = await this.repository.findById(userId);

    if (!targetUser) {
      throw new NotFoundError("User not found.", "user_not_found");
    }

    if (context.actorUserId === userId) {
      throw new ValidationError("You cannot deactivate your own account.", "user_self_deactivate");
    }

    await this.assertCanRemoveActiveAdmin(targetUser);

    const user = await this.repository.updateById(userId, {
      deactivatedAt: targetUser.deactivatedAt ?? new Date(),
    });

    return toUserAdminItem(user);
  }
}
