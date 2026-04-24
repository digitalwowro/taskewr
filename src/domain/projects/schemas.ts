import { z } from "zod";

export const projectMutationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().default(""),
});

export type ProjectMutationInput = z.infer<typeof projectMutationSchema>;

export const projectMoveSchema = z.object({
  direction: z.enum(["up", "down"]),
});

export type ProjectMoveInput = z.infer<typeof projectMoveSchema>;
