const DEFAULT_TIMEZONE = "UTC";

function getFormatter(timezone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    ...options,
  });
}

function toDateParts(date: Date, timezone: string) {
  const parts = getFormatter(timezone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? "1970"),
    month: Number(parts.find((part) => part.type === "month")?.value ?? "01"),
    day: Number(parts.find((part) => part.type === "day")?.value ?? "01"),
  };
}

function toDayStamp(date: Date, timezone: string) {
  const { year, month, day } = toDateParts(date, timezone);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function resolveTimezone(timezone?: string | null) {
  return timezone || DEFAULT_TIMEZONE;
}

export function getRelativeDayOffset(
  targetDate: Date | null,
  referenceDate = new Date(),
  timezone?: string | null,
) {
  if (!targetDate) {
    return null;
  }

  const safeTimezone = resolveTimezone(timezone);
  return toDayStamp(targetDate, safeTimezone) - toDayStamp(referenceDate, safeTimezone);
}

export function isOverdueDate(
  targetDate: Date | null,
  referenceDate = new Date(),
  timezone?: string | null,
) {
  const offset = getRelativeDayOffset(targetDate, referenceDate, timezone);
  return offset !== null && offset < 0;
}

export function formatDashboardDueLabel(
  targetDate: Date | null,
  referenceDate = new Date(),
  timezone?: string | null,
) {
  if (!targetDate) {
    return "No due date";
  }

  const safeTimezone = resolveTimezone(timezone);
  const offset = getRelativeDayOffset(targetDate, referenceDate, safeTimezone);

  if (offset === null) {
    return "No due date";
  }

  if (offset < 0) {
    const overdueDays = Math.abs(offset);
    return overdueDays === 1 ? "1 day overdue" : `${overdueDays} days overdue`;
  }

  if (offset === 0) {
    return "Today";
  }

  if (offset === 1) {
    return "Tomorrow";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimezone,
    month: "short",
    day: "numeric",
  }).format(targetDate);
}
