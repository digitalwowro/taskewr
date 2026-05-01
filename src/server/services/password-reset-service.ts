import { assertCanManageUsers } from "@/domain/auth/policies";
import {
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  type PasswordResetConfirmInput,
  type PasswordResetRequestInput,
} from "@/domain/auth/schemas";
import { NotFoundError, ValidationError } from "@/domain/common/errors";
import { PasswordResetRepository } from "@/data/prisma/repositories/password-reset-repository";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import {
  createPasswordResetToken,
  getPasswordResetExpiry,
  hashPasswordResetToken,
} from "@/lib/password-reset-tokens";
import { sendPasswordResetEmail } from "@/server/email/password-reset";
import { AppContextService } from "@/server/services/app-context-service";

const RESET_REQUEST_ACCEPTED = {
  ok: true,
  message: "If that email address belongs to an active account, a password reset link will be sent.",
};

type PasswordResetEmailSender = typeof sendPasswordResetEmail;

export class PasswordResetService {
  constructor(
    private readonly repository = new PasswordResetRepository(db),
    private readonly contextService = new AppContextService(),
    private readonly emailSender: PasswordResetEmailSender = sendPasswordResetEmail,
  ) {}

  async requestPasswordReset(
    input: PasswordResetRequestInput,
    metadata: { ip?: string; userAgent?: string | null } = {},
  ) {
    const payload = passwordResetRequestSchema.parse(input);
    const user = await this.repository.findUserByEmail(payload.email);

    if (!user || user.deactivatedAt !== null) {
      return RESET_REQUEST_ACCEPTED;
    }

    const token = await this.createResetToken(user.id, metadata);

    try {
      await this.emailSender({
        to: user.email,
        name: user.name,
        token,
      });
    } catch (error) {
      console.error(error);
    }

    return RESET_REQUEST_ACCEPTED;
  }

  async sendAdminPasswordResetEmail(userId: number) {
    const context = await this.contextService.getAppContext();
    assertCanManageUsers({ appRole: context.appRole });

    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new NotFoundError("User not found.", "user_not_found");
    }

    if (user.deactivatedAt !== null) {
      throw new ValidationError(
        "Inactive users cannot receive password reset emails.",
        "password_reset_user_inactive",
      );
    }

    const token = await this.createResetToken(user.id);

    await this.emailSender({
      to: user.email,
      name: user.name,
      token,
    });

    return {
      ok: true,
      message: "Password reset email sent.",
    };
  }

  async confirmPasswordReset(input: PasswordResetConfirmInput) {
    const payload = passwordResetConfirmSchema.parse(input);
    const result = await this.repository.consumeTokenAndUpdatePassword({
      tokenHash: hashPasswordResetToken(payload.token),
      passwordHash: hashPassword(payload.password),
      now: new Date(),
    });

    if (!result) {
      throw new ValidationError(
        "This reset link is invalid or expired.",
        "password_reset_token_invalid",
      );
    }

    return {
      ok: true,
      message: "Password updated.",
    };
  }

  private async createResetToken(
    userId: number,
    metadata: { ip?: string; userAgent?: string | null } = {},
  ) {
    const token = createPasswordResetToken();

    await this.repository.createToken({
      userId,
      tokenHash: hashPasswordResetToken(token),
      expiresAt: getPasswordResetExpiry(),
      requestIp: metadata.ip?.slice(0, 120) ?? null,
      requestUserAgent: metadata.userAgent?.slice(0, 500) ?? null,
    });

    return token;
  }
}
