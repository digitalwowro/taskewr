const DEFAULT_NOTIFICATION_TIMEZONE = "UTC";
const DUE_REMINDER_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isDueReminderTime(value: string) {
  return DUE_REMINDER_TIME_PATTERN.test(value);
}

export function normalizeDueReminderTime(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function getSafeTimezone(timezone: string | null | undefined) {
  const candidate = timezone || DEFAULT_NOTIFICATION_TIMEZONE;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return DEFAULT_NOTIFICATION_TIMEZONE;
  }
}

function getDateParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

function getTimezoneOffsetMs(date: Date, timezone: string) {
  const parts = getDateParts(date, timezone);
  const zonedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return zonedAsUtc - date.getTime();
}

export function dateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function scheduledAtForDueReminder(input: {
  dueDate: Date;
  dueReminderTime: string;
  timezone?: string | null;
}) {
  if (!isDueReminderTime(input.dueReminderTime)) {
    throw new Error("Due reminder time must use HH:mm format.");
  }

  const [year, month, day] = dateOnlyString(input.dueDate).split("-").map(Number);
  const [hour, minute] = input.dueReminderTime.split(":").map(Number);
  const timezone = getSafeTimezone(input.timezone);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let utcMs = localAsUtc;

  for (let index = 0; index < 3; index += 1) {
    utcMs = localAsUtc - getTimezoneOffsetMs(new Date(utcMs), timezone);
  }

  return new Date(utcMs);
}

export function sameInstant(first: Date, second: Date) {
  return first.getTime() === second.getTime();
}
