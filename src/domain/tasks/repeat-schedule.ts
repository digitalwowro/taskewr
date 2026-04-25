import type { RepeatSettingsInput } from "./repeat-schemas";

const MAX_DUE_DATES = 366;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type RepeatSchedule = Omit<RepeatSettingsInput, "enabled" | "incompleteBehavior">;

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMonths(value: Date, months: number) {
  const next = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + months, 1));
  return next;
}

function daysInUtcMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function clampMonthDay(year: number, monthIndex: number, day: number) {
  return Math.min(day, daysInUtcMonth(year, monthIndex));
}

function getIsoWeekday(value: Date) {
  const day = value.getUTCDay();
  return day === 0 ? 7 : day;
}

function startOfIsoWeek(value: Date) {
  return addDays(value, 1 - getIsoWeekday(value));
}

function diffDays(start: Date, end: Date) {
  return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY);
}

function pushIfWithin(results: string[], date: Date, start: Date, end: Date) {
  if (date >= start && date <= end) {
    results.push(formatDateOnly(date));
  }
}

function getIntervalDayDueDates(schedule: RepeatSchedule, start: Date, end: Date) {
  const results: string[] = [];
  let cursor = new Date(start);

  while (cursor <= end && results.length < MAX_DUE_DATES) {
    results.push(formatDateOnly(cursor));
    cursor = addDays(cursor, schedule.interval);
  }

  return results;
}

function getWeeklyDueDates(schedule: RepeatSchedule, start: Date, end: Date) {
  const results: string[] = [];
  const anchorWeekStart = startOfIsoWeek(start);
  const weekdays = [...new Set(schedule.weekdays)].sort((a, b) => a - b);
  let cursor = startOfIsoWeek(start);

  while (cursor <= end && results.length < MAX_DUE_DATES) {
    const weekOffset = Math.floor(diffDays(anchorWeekStart, cursor) / 7);

    if (weekOffset % schedule.interval === 0) {
      for (const weekday of weekdays) {
        pushIfWithin(results, addDays(cursor, weekday - 1), start, end);
      }
    }

    cursor = addDays(cursor, 7);
  }

  return results.sort();
}

function getMonthlyDueDates(schedule: RepeatSchedule, start: Date, end: Date) {
  const results: string[] = [];
  const monthDay = schedule.monthDay ?? 1;
  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const anchorMonth = cursor.getUTCFullYear() * 12 + cursor.getUTCMonth();

  while (cursor <= end && results.length < MAX_DUE_DATES) {
    const monthOffset = cursor.getUTCFullYear() * 12 + cursor.getUTCMonth() - anchorMonth;

    if (monthOffset % schedule.interval === 0) {
      const dueDate = new Date(
        Date.UTC(
          cursor.getUTCFullYear(),
          cursor.getUTCMonth(),
          clampMonthDay(cursor.getUTCFullYear(), cursor.getUTCMonth(), monthDay),
        ),
      );
      pushIfWithin(results, dueDate, start, end);
    }

    cursor = addMonths(cursor, 1);
  }

  return results;
}

function getSpecificDueDates(schedule: RepeatSchedule, start: Date, end: Date) {
  return [...new Set(schedule.specificDates)]
    .sort()
    .filter((date) => {
      const parsed = parseDateOnly(date);
      return parsed >= start && parsed <= end;
    });
}

export function getRepeatDueDatesThrough(
  schedule: RepeatSchedule,
  startDate: string,
  throughDate: string,
) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(throughDate);

  if (end < start) {
    return [];
  }

  switch (schedule.scheduleType) {
    case "weekly":
      return getWeeklyDueDates(schedule, start, end);
    case "monthly":
      return getMonthlyDueDates(schedule, start, end);
    case "specific_dates":
      return getSpecificDueDates(schedule, start, end);
    case "interval_days":
    default:
      return getIntervalDayDueDates(schedule, start, end);
  }
}

export function getNextRepeatDueDate(
  schedule: RepeatSchedule,
  startDate: string,
  afterDate: string,
) {
  const searchStart = addDays(parseDateOnly(afterDate), 1);
  const searchEnd = addDays(searchStart, 366 * 5);
  const dueDates = getRepeatDueDatesThrough(
    schedule,
    startDate,
    formatDateOnly(searchEnd),
  );

  return dueDates.find((date) => parseDateOnly(date) >= searchStart) ?? null;
}

