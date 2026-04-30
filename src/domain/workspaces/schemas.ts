import { z } from "zod";

import { MANAGEABLE_WORKSPACE_ROLES } from "@/domain/auth/types";

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

export const workspaceListQuerySchema = z.object({
  query: z.string().trim().max(160).optional().default(""),
});

export const workspaceMutationSchema = z.object({
  name: z.string().trim().min(1).max(160),
  ownerUserId: z.number().int().positive().optional(),
  description: z
    .union([z.string().trim().max(2000), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      if (value === null) {
        return null;
      }

      return value.trim() || null;
    }),
});

export const workspaceMemberCreateSchema = z.object({
  userId: z.number().int().positive(),
  role: z.enum(MANAGEABLE_WORKSPACE_ROLES).optional().default("member"),
});

export const workspaceMemberUpdateSchema = z.object({
  role: z.enum(MANAGEABLE_WORKSPACE_ROLES),
});

export const workspaceMemberNewUserSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: normalizedEmailSchema,
  password: z.string().min(7).max(200),
  timezone: timezoneSchema,
  role: z.enum(MANAGEABLE_WORKSPACE_ROLES).optional().default("member"),
});

export type WorkspaceListQueryInput = z.input<typeof workspaceListQuerySchema>;
export type WorkspaceMutationInput = z.input<typeof workspaceMutationSchema>;
export type WorkspaceMemberCreateInput = z.input<typeof workspaceMemberCreateSchema>;
export type WorkspaceMemberUpdateInput = z.input<typeof workspaceMemberUpdateSchema>;
export type WorkspaceMemberNewUserInput = z.input<typeof workspaceMemberNewUserSchema>;
