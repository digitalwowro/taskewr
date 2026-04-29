import { z } from "zod";

import { APP_ROLES } from "@/domain/auth/types";

const normalizedEmailSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.email(),
);

const timezoneSchema = z
  .union([z.string().trim().max(100), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    return value.trim() || null;
  });

export const userListQuerySchema = z.object({
  query: z.string().trim().max(160).optional().default(""),
  includeInactive: z.boolean().optional().default(false),
});

export const adminUserCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: normalizedEmailSchema,
  password: z.string().min(7).max(200),
  timezone: timezoneSchema,
  appRole: z.enum(APP_ROLES).optional().default("user"),
});

export const adminUserUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: normalizedEmailSchema.optional(),
  timezone: timezoneSchema,
  appRole: z.enum(APP_ROLES).optional(),
  isActive: z.boolean().optional(),
});

export const adminUserPasswordSchema = z.object({
  password: z.string().min(7).max(200),
});

export type UserListQueryInput = z.input<typeof userListQuerySchema>;
export type AdminUserCreateInput = z.input<typeof adminUserCreateSchema>;
export type AdminUserUpdateInput = z.input<typeof adminUserUpdateSchema>;
export type AdminUserPasswordInput = z.input<typeof adminUserPasswordSchema>;
