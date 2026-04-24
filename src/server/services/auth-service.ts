import { cookies } from "next/headers";

import { loginSchema, profileUpdateSchema, type LoginInput, type ProfileUpdateInput } from "@/domain/auth/schemas";
import { AuthenticationError, NotFoundError, ValidationError } from "@/domain/common/errors";
import { SESSION_COOKIE_NAME, createSessionToken, hashPassword, parseSessionToken, verifyPassword } from "@/lib/auth";
import type { AuthenticatedActor, SessionPayload } from "@/types/auth";
import { db } from "@/lib/db";

export class AuthService {
  async loginWithPassword(input: LoginInput): Promise<SessionPayload> {
    const payload = loginSchema.parse(input);

    const user = await db.user.findUnique({
      where: { email: payload.email },
      include: {
        memberships: {
          orderBy: { id: "asc" },
          include: {
            workspace: true,
          },
          take: 1,
        },
      },
    });

    if (!user || !verifyPassword(payload.password, user.passwordHash)) {
      throw new AuthenticationError("Invalid email or password.", "auth_invalid_credentials");
    }

    const membership = user.memberships[0];

    if (!membership) {
      throw new NotFoundError("Workspace membership not found.", "workspace_membership_not_found");
    }

    return {
      userId: user.id,
      workspaceId: membership.workspaceId,
      workspaceRole: membership.role,
      timezone: user.timezone,
      issuedAt: Date.now(),
    };
  }

  async setSessionCookie(session: SessionPayload) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(session), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
  }

  async clearSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  async getSession(): Promise<SessionPayload | null> {
    try {
      const cookieStore = await cookies();
      return parseSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
    } catch {
      return null;
    }
  }

  async getAuthenticatedActor(): Promise<AuthenticatedActor | null> {
    const session = await this.getSession();

    if (!session) {
      return null;
    }

    return {
      userId: session.userId,
      workspaceId: session.workspaceId,
      workspaceRole: session.workspaceRole,
      timezone: session.timezone,
    };
  }

  async getCurrentUserProfile() {
    const actor = await this.getAuthenticatedActor();

    if (!actor) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: actor.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        timezone: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      workspaceId: actor.workspaceId,
      workspaceRole: actor.workspaceRole,
    };
  }

  async updateCurrentUserProfile(input: ProfileUpdateInput) {
    const actor = await this.getAuthenticatedActor();

    if (!actor) {
      throw new AuthenticationError("Not authenticated.", "auth_not_authenticated");
    }

    const payload = profileUpdateSchema.parse(input);

    const user = await db.user.findUnique({
      where: { id: actor.userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found.", "user_not_found");
    }

    if (payload.email !== user.email) {
      const existingUser = await db.user.findUnique({
        where: { email: payload.email },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== user.id) {
        throw new ValidationError("Email address is already in use.", "user_email_taken");
      }
    }

    const passwordData =
      payload.newPassword && payload.newPassword.length > 0
        ? (() => {
            if (!verifyPassword(payload.currentPassword ?? "", user.passwordHash)) {
              throw new ValidationError(
                "Current password is incorrect.",
                "user_current_password_invalid",
              );
            }

            return { passwordHash: hashPassword(payload.newPassword) };
          })()
        : {};

    const updatedUser = await db.user.update({
      where: { id: actor.userId },
      data: {
        name: payload.name,
        email: payload.email,
        avatarUrl: payload.avatarUrl,
        ...passwordData,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        timezone: true,
      },
    });

    return {
      ...updatedUser,
      workspaceId: actor.workspaceId,
      workspaceRole: actor.workspaceRole,
    };
  }
}
