import { z } from "zod";
import { MANAGEABLE_PROJECT_ROLES } from "@/domain/auth/types";

export const projectMutationSchema = z.object({
  workspaceId: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().default(""),
});

export type ProjectMutationInput = z.infer<typeof projectMutationSchema>;

export const projectMoveSchema = z.object({
  direction: z.enum(["up", "down"]),
});

export type ProjectMoveInput = z.infer<typeof projectMoveSchema>;

export const projectMemberCreateSchema = z.object({
  userId: z.number().int().positive(),
  role: z.enum(MANAGEABLE_PROJECT_ROLES).optional().default("member"),
});

export const projectMemberUpdateSchema = z.object({
  role: z.enum(MANAGEABLE_PROJECT_ROLES),
});

export type ProjectMemberCreateInput = z.input<typeof projectMemberCreateSchema>;
export type ProjectMemberUpdateInput = z.input<typeof projectMemberUpdateSchema>;
