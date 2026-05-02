"use client";

import { useMemo, useState } from "react";
import type { RepeatIncompleteBehavior, RepeatScheduleType } from "@/domain/tasks/repeat-schemas";
import { TaskPropertyRow } from "@/components/app/task-property-panel";
import { SearchableSelect, type SearchableSelectOption } from "@/components/app/ui";

const WEEKDAY_OPTIONS = [
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
  [7, "Sun"],
] as const;

const CALENDAR_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PROPERTY_INPUT_CLASS =
  "h-8 w-full rounded-lg border border-transparent bg-transparent px-2 text-sm text-[var(--ink-strong)] outline-none transition hover:bg-[var(--surface-subtle)] focus:border-[var(--line-strong)] focus:bg-white disabled:cursor-not-allowed disabled:text-[var(--ink-subtle)]";
const REPEAT_SCHEDULE_OPTIONS: SearchableSelectOption[] = [
  { value: "interval_days", label: "Days" },
  { value: "weekly", label: "Weeks" },
  { value: "monthly", label: "Months" },
  { value: "specific_dates", label: "Specific dates" },
];
const REPEAT_INCOMPLETE_OPTIONS: SearchableSelectOption[] = [
  { value: "carry_forward", label: "Reuse the open task" },
  { value: "create_separate", label: "Create a separate task" },
];

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

function parseSpecificDates(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(isIsoDate))].sort();
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getCalendarMonthFromDates(dates: string[]) {
  if (dates[0]) {
    return getMonthStart(new Date(`${dates[0]}T00:00:00`));
  }

  return getMonthStart(new Date());
}

function addMonths(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function buildCalendarDays(monthDate: Date) {
  const monthStart = getMonthStart(monthDate);
  const firstWeekday = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - firstWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function SpecificDatesCalendar({
  disabled,
  value,
  onChange,
}: {
  disabled: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedDates = useMemo(() => parseSpecificDates(value), [value]);
  const selectedDateSet = useMemo(() => new Set(selectedDates), [selectedDates]);
  const [visibleMonth, setVisibleMonth] = useState(() => getCalendarMonthFromDates(selectedDates));
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const monthLabel = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);

  const toggleDate = (date: Date) => {
    const isoDate = formatIsoDate(date);
    const nextDates = selectedDateSet.has(isoDate)
      ? selectedDates.filter((item) => item !== isoDate)
      : [...selectedDates, isoDate].sort();

    onChange(nextDates.join(", "));
  };

  return (
    <div className="space-y-3 rounded-lg border border-[var(--line-soft)] bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
          disabled={disabled}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line-soft)] text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Previous month"
          title="Previous month"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="m9.75 3.75-4.5 4.25 4.5 4.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="text-sm font-semibold text-[var(--ink-strong)]">{monthLabel}</p>
        <button
          type="button"
          onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
          disabled={disabled}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line-soft)] text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Next month"
          title="Next month"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="m6.25 3.75 4.5 4.25-4.5 4.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {CALENDAR_WEEKDAYS.map((weekday) => (
          <div key={weekday} className="py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-subtle)]">
            {weekday}
          </div>
        ))}
        {calendarDays.map((date) => {
          const isoDate = formatIsoDate(date);
          const isSelected = selectedDateSet.has(isoDate);
          const isVisibleMonth = date.getMonth() === visibleMonth.getMonth();

          return (
            <button
              key={isoDate}
              type="button"
              onClick={() => toggleDate(date)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={`h-9 rounded-lg border text-[12px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? "border-[rgba(34,122,89,0.24)] bg-[rgba(34,122,89,0.1)] text-[var(--accent-strong)]"
                  : isVisibleMonth
                    ? "border-transparent bg-[var(--surface-card)] text-[var(--ink-muted)] hover:border-[var(--line-strong)] hover:bg-white hover:text-[var(--ink-strong)]"
                    : "border-transparent bg-transparent text-[var(--ink-subtle)] hover:bg-[var(--surface-subtle)]"
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-8 flex-wrap items-center gap-2 border-t border-[var(--line-soft)] pt-3">
        {selectedDates.length > 0 ? (
          selectedDates.map((date) => (
            <button
              key={date}
              type="button"
              onClick={() => onChange(selectedDates.filter((item) => item !== date).join(", "))}
              disabled={disabled}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] px-2.5 text-xs font-medium text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              title="Remove date"
            >
              {date}
              <span aria-hidden="true">×</span>
            </button>
          ))
        ) : (
          <p className="text-xs text-[var(--ink-subtle)]">Select one or more dates.</p>
        )}
      </div>
    </div>
  );
}

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
    <>
      <TaskPropertyRow icon="repeat" label="Repeat">
        <label className="inline-flex min-h-8 items-center gap-2 rounded-lg px-2 text-sm font-medium text-[var(--ink-strong)] transition hover:bg-[var(--surface-subtle)]">
          <input
            type="checkbox"
            checked={repeatEnabled}
            onChange={(event) => setRepeatEnabled(event.target.checked)}
            disabled={isSaving}
            className="h-4 w-4 rounded-lg accent-[var(--accent-strong)]"
          />
          Repeat this task
        </label>
      </TaskPropertyRow>

      {repeatEnabled ? (
        <>
          <TaskPropertyRow icon="schedule" label="Every">
            <input
              type="number"
              min={1}
              max={365}
              value={repeatInterval}
              onChange={(event) => setRepeatInterval(event.target.value)}
              disabled={isSaving}
              aria-label="Repeat interval"
              className={PROPERTY_INPUT_CLASS}
            />
          </TaskPropertyRow>

          <TaskPropertyRow icon="schedule" label="Schedule">
            <SearchableSelect
              value={repeatScheduleType}
              options={REPEAT_SCHEDULE_OPTIONS}
              onChange={(nextScheduleType) =>
                setRepeatScheduleType(nextScheduleType as RepeatScheduleType)
              }
              disabled={isSaving}
              ariaLabel="Repeat schedule"
              inputClassName="border-transparent"
            />
          </TaskPropertyRow>

          <TaskPropertyRow icon="repeat" label="Incomplete task">
            <SearchableSelect
              value={repeatIncompleteBehavior}
              options={REPEAT_INCOMPLETE_OPTIONS}
              onChange={(nextIncompleteBehavior) =>
                setRepeatIncompleteBehavior(nextIncompleteBehavior as RepeatIncompleteBehavior)
              }
              disabled={isSaving}
              ariaLabel="Incomplete task repeat behavior"
              inputClassName="border-transparent"
            />
          </TaskPropertyRow>

          {repeatScheduleType === "weekly" ? (
            <TaskPropertyRow icon="schedule" label="Weekdays">
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_OPTIONS.map(([weekday, label]) => (
                  <button
                    key={weekday}
                    type="button"
                    onClick={() => toggleRepeatWeekday(weekday)}
                    disabled={isSaving}
                    className={`h-8 rounded-lg border px-3 text-xs font-semibold ${
                      repeatWeekdays.includes(weekday)
                        ? "border-[rgba(34,122,89,0.24)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]"
                        : "border-[var(--line-strong)] bg-white text-[var(--ink-muted)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </TaskPropertyRow>
          ) : null}

          {repeatScheduleType === "monthly" ? (
            <TaskPropertyRow icon="schedule" label="Day of month">
              <input
                type="number"
                min={1}
                max={31}
                value={repeatMonthDay}
                onChange={(event) => setRepeatMonthDay(event.target.value)}
                disabled={isSaving}
                aria-label="Repeat day of month"
                className={PROPERTY_INPUT_CLASS}
              />
            </TaskPropertyRow>
          ) : null}

          {repeatScheduleType === "specific_dates" ? (
            <TaskPropertyRow icon="schedule" label="Dates">
              <SpecificDatesCalendar
                disabled={isSaving}
                value={repeatSpecificDates}
                onChange={setRepeatSpecificDates}
              />
            </TaskPropertyRow>
          ) : null}
        </>
      ) : null}
    </>
  );
}
