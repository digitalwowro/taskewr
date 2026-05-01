import { z } from "zod";

const normalizedEmailSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.email(),
);

export const loginSchema = z.object({
  email: normalizedEmailSchema,
  password: z.string().min(1).max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const passwordResetRequestSchema = z.object({
  email: normalizedEmailSchema,
});

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

export const passwordResetConfirmSchema = z.object({
  token: z.string().trim().min(32).max(500),
  password: z.string().min(7).max(200),
});

export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;

export const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: normalizedEmailSchema,
    currentPassword: z.string().max(200).optional().or(z.literal("")),
    newPassword: z.string().min(7).max(200).optional().or(z.literal("")),
    avatarUrl: z.string().max(2_000_000).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    const hasCurrentPassword = Boolean(value.currentPassword);
    const hasNewPassword = Boolean(value.newPassword);

    if (hasNewPassword && !hasCurrentPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["currentPassword"],
        message: "Current password is required to set a new password.",
      });
    }
  });

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
