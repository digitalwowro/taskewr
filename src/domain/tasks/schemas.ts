import { z } from "zod";

import {
  DEFAULT_TASK_DIRECTION,
  DEFAULT_TASK_PRIORITIES,
  DEFAULT_TASK_SORT,
  DEFAULT_TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_SORT_DIRECTIONS,
  TASK_SORT_OPTIONS,
  TASK_STATUSES,
} from "./constants";
import { isDueReminderTime, normalizeDueReminderTime } from "./notification-schedule";
import { repeatSettingsSchema } from "./repeat-schemas";

export const taskStatusSchema = z.enum(TASK_STATUSES);
export const taskPrioritySchema = z.enum(TASK_PRIORITIES);
export const taskSortOptionSchema = z.enum(TASK_SORT_OPTIONS);
export const taskSortDirectionSchema = z.enum(TASK_SORT_DIRECTIONS);

export const taskFiltersSchema = z.object({
  view: z.enum(["list", "board"]).default("list"),
  sort: taskSortOptionSchema.default(DEFAULT_TASK_SORT),
  direction: taskSortDirectionSchema.default(DEFAULT_TASK_DIRECTION),
  status: z.array(taskStatusSchema).default(DEFAULT_TASK_STATUSES),
  priority: z.array(taskPrioritySchema).default(DEFAULT_TASK_PRIORITIES),
});

export type TaskFilters = z.infer<typeof taskFiltersSchema>;

export const taskMutationSchema = z
  .object({
    projectId: z.number().int().positive(),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(10000).optional().default(""),
    parentTaskId: z.number().int().positive().nullable().optional().default(null),
    status: taskStatusSchema,
    priority: taskPrioritySchema,
    startDate: z.string().date().nullable().optional().default(null),
    dueDate: z.string().date().nullable().optional().default(null),
    dueReminderTime: z
      .preprocess((value) => {
        if (typeof value !== "string") {
          return value;
        }

        return normalizeDueReminderTime(value);
      }, z.string().refine(isDueReminderTime, "Reminder time must use HH:mm format.").nullable().optional())
      .default(null),
    labels: z.array(z.string().trim().min(1).max(120)).max(30).optional().default([]),
    repeat: repeatSettingsSchema.optional().default({
      enabled: false,
      scheduleType: "interval_days",
      interval: 1,
      weekdays: [],
      monthDay: null,
      specificDates: [],
      incompleteBehavior: "carry_forward",
    }),
  })
  .superRefine((value, ctx) => {
    if (value.startDate && value.dueDate && value.dueDate < value.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dueDate"],
        message: "Due date must be on or after start date.",
      });
    }

    if (value.dueReminderTime && !value.dueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dueReminderTime"],
        message: "Reminder time requires a due date.",
      });
    }
  });

export type TaskMutationInput = z.infer<typeof taskMutationSchema>;

export const boardMoveSchema = z.object({
  taskId: z.number().int().positive(),
  projectId: z.number().int().positive(),
  nextStatus: taskStatusSchema,
  targetLaneTaskIds: z.array(z.number().int().positive()),
});

export type BoardMoveInput = z.infer<typeof boardMoveSchema>;
