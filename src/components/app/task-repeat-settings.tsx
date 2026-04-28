"use client";

import type { RepeatIncompleteBehavior, RepeatScheduleType } from "@/domain/tasks/repeat-schemas";

const WEEKDAY_OPTIONS = [
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
  [7, "Sun"],
] as const;

export function TaskRepeatSettings({
  isSaving,
  repeatEnabled,
  repeatIncompleteBehavior,
  repeatInterval,
  repeatMonthDay,
  repeatScheduleType,
  repeatSpecificDates,
  repeatWeekdays,
  setRepeatEnabled,
  setRepeatIncompleteBehavior,
  setRepeatInterval,
  setRepeatMonthDay,
  setRepeatScheduleType,
  setRepeatSpecificDates,
  toggleRepeatWeekday,
}: {
  isSaving: boolean;
  repeatEnabled: boolean;
  repeatIncompleteBehavior: RepeatIncompleteBehavior;
  repeatInterval: string;
  repeatMonthDay: string;
  repeatScheduleType: RepeatScheduleType;
  repeatSpecificDates: string;
  repeatWeekdays: number[];
  setRepeatEnabled: (value: boolean) => void;
  setRepeatIncompleteBehavior: (value: RepeatIncompleteBehavior) => void;
  setRepeatInterval: (value: string) => void;
  setRepeatMonthDay: (value: string) => void;
  setRepeatScheduleType: (value: RepeatScheduleType) => void;
  setRepeatSpecificDates: (value: string) => void;
  toggleRepeatWeekday: (weekday: number) => void;
}) {
  return (
    <div className="space-y-3 rounded-[20px] border border-[var(--line-soft)] bg-[var(--surface-card)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
            Repeat
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ink-strong)]">
          <input
            type="checkbox"
            checked={repeatEnabled}
            onChange={(event) => setRepeatEnabled(event.target.checked)}
            disabled={isSaving}
            className="h-4 w-4 accent-[var(--accent-strong)]"
          />
          Repeat this task
        </label>
      </div>

      {repeatEnabled ? (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[0.8fr_1fr_1.2fr]">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                Every
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={repeatInterval}
                onChange={(event) => setRepeatInterval(event.target.value)}
                disabled={isSaving}
                className="h-9 w-full rounded-[14px] border border-[var(--line-strong)] bg-white px-3 text-[13px] text-[var(--ink-strong)] outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                Schedule
              </label>
              <select
                value={repeatScheduleType}
                onChange={(event) => setRepeatScheduleType(event.target.value as RepeatScheduleType)}
                disabled={isSaving}
                className="h-9 w-full rounded-[14px] border border-[var(--line-strong)] bg-white px-3 text-[13px] text-[var(--ink-strong)] outline-none"
              >
                <option value="interval_days">Days</option>
                <option value="weekly">Weeks</option>
                <option value="monthly">Months</option>
                <option value="specific_dates">Specific dates</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                Incomplete task
              </label>
              <select
                value={repeatIncompleteBehavior}
                onChange={(event) =>
                  setRepeatIncompleteBehavior(event.target.value as RepeatIncompleteBehavior)
                }
                disabled={isSaving}
                className="h-9 w-full rounded-[14px] border border-[var(--line-strong)] bg-white px-3 text-[13px] text-[var(--ink-strong)] outline-none"
              >
                <option value="carry_forward">Reuse the open task</option>
                <option value="create_separate">Create a separate task</option>
              </select>
            </div>
          </div>

          {repeatScheduleType === "weekly" ? (
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_OPTIONS.map(([weekday, label]) => (
                <button
                  key={weekday}
                  type="button"
                  onClick={() => toggleRepeatWeekday(weekday)}
                  disabled={isSaving}
                  className={`h-8 rounded-xl border px-3 text-xs font-semibold ${
                    repeatWeekdays.includes(weekday)
                      ? "border-[rgba(34,122,89,0.24)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]"
                      : "border-[var(--line-strong)] bg-white text-[var(--ink-muted)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}

          {repeatScheduleType === "monthly" ? (
            <div className="max-w-48 space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                Day of month
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={repeatMonthDay}
                onChange={(event) => setRepeatMonthDay(event.target.value)}
                disabled={isSaving}
                className="h-9 w-full rounded-[14px] border border-[var(--line-strong)] bg-white px-3 text-[13px] text-[var(--ink-strong)] outline-none"
              />
            </div>
          ) : null}

          {repeatScheduleType === "specific_dates" ? (
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                Dates
              </label>
              <input
                value={repeatSpecificDates}
                onChange={(event) => setRepeatSpecificDates(event.target.value)}
                disabled={isSaving}
                placeholder="2026-05-01, 2026-05-15"
                className="h-9 w-full rounded-[14px] border border-[var(--line-strong)] bg-white px-3 text-[13px] text-[var(--ink-strong)] outline-none placeholder:text-[var(--ink-subtle)]"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
