import { z } from "zod";

export const REPEAT_SCHEDULE_TYPES = [
  "interval_days",
  "weekly",
  "monthly",
  "specific_dates",
] as const;

export const REPEAT_INCOMPLETE_BEHAVIORS = [
  "carry_forward",
  "create_separate",
] as const;

export const repeatScheduleTypeSchema = z.enum(REPEAT_SCHEDULE_TYPES);
export const repeatIncompleteBehaviorSchema = z.enum(REPEAT_INCOMPLETE_BEHAVIORS);

export const repeatSettingsSchema = z
  .object({
    enabled: z.boolean().default(false),
    scheduleType: repeatScheduleTypeSchema.default("interval_days"),
    interval: z.number().int().min(1).max(365).default(1),
    weekdays: z.array(z.number().int().min(1).max(7)).default([]),
    monthDay: z.number().int().min(1).max(31).nullable().default(null),
    specificDates: z.array(z.string().date()).default([]),
    incompleteBehavior: repeatIncompleteBehaviorSchema.default("carry_forward"),
  })
  .superRefine((value, ctx) => {
    if (!value.enabled) {
      return;
    }

    if (value.scheduleType === "weekly" && value.weekdays.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["weekdays"],
        message: "Select at least one weekday.",
      });
    }

    if (value.scheduleType === "monthly" && value.monthDay === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["monthDay"],
        message: "Select a day of the month.",
      });
    }

    if (value.scheduleType === "specific_dates" && value.specificDates.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["specificDates"],
        message: "Add at least one date.",
      });
    }
  });

export type RepeatSettingsInput = z.infer<typeof repeatSettingsSchema>;
export type RepeatScheduleType = z.infer<typeof repeatScheduleTypeSchema>;
export type RepeatIncompleteBehavior = z.infer<typeof repeatIncompleteBehaviorSchema>;

