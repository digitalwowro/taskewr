import { z } from "zod";

import { taskPrioritySchema, taskSortDirectionSchema, taskSortOptionSchema, taskStatusSchema } from "@/domain/tasks/schemas";

export const taskSearchInputSchema = z.object({
  query: z.string().trim().default(""),
  sort: taskSortOptionSchema.default("priority"),
  direction: taskSortDirectionSchema.default("desc"),
  status: z.array(taskStatusSchema).default(["todo", "in_progress"]),
  priority: z.array(taskPrioritySchema).default([]),
  includeArchivedProjects: z.boolean().default(false),
  limit: z.number().int().positive().max(100).default(50),
  workspaceId: z.number().int().positive().optional(),
});

export type TaskSearchInput = z.infer<typeof taskSearchInputSchema>;

export type TaskSearchResult = {
  id: number;
  title: string;
  projectId: number;
  projectName: string;
  status: string;
  priority: string;
  dueDate: Date | null;
};
