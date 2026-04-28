import { RateLimitError } from "@/domain/common/errors";

type LoginRateLimitRecord = {
  attempts: number;
  resetAt: number;
};

export type LoginRateLimitConfig = {
  maxAttempts?: number;
  windowMs?: number;
  now?: () => number;
};

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return (
    forwardedFor ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

export class LoginRateLimiter {
  private readonly attempts = new Map<string, LoginRateLimitRecord>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly now: () => number;

  constructor(config: LoginRateLimitConfig = {}) {
    this.maxAttempts = config.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    this.windowMs = config.windowMs ?? DEFAULT_WINDOW_MS;
    this.now = config.now ?? Date.now;
  }

  assertAllowed(input: { email: string; ip: string }) {
    const record = this.getActiveRecord(this.buildKey(input));

    if (record && record.attempts >= this.maxAttempts) {
      throw new RateLimitError(
        "Too many failed login attempts. Please wait and try again.",
        "login_rate_limited",
      );
    }
  }

  recordFailure(input: { email: string; ip: string }) {
    const key = this.buildKey(input);
    const current = this.getActiveRecord(key);
    const next: LoginRateLimitRecord = current
      ? {
          ...current,
          attempts: current.attempts + 1,
        }
      : {
          attempts: 1,
          resetAt: this.now() + this.windowMs,
        };

    this.attempts.set(key, next);

    if (next.attempts >= this.maxAttempts) {
      throw new RateLimitError(
        "Too many failed login attempts. Please wait and try again.",
        "login_rate_limited",
      );
    }
  }

  recordSuccess(input: { email: string; ip: string }) {
    this.attempts.delete(this.buildKey(input));
  }

  clear() {
    this.attempts.clear();
  }

  private getActiveRecord(key: string) {
    const record = this.attempts.get(key);

    if (!record) {
      return null;
    }

    if (record.resetAt <= this.now()) {
      this.attempts.delete(key);
      return null;
    }

    return record;
  }

  private buildKey(input: { email: string; ip: string }) {
    return `${input.ip}:${normalizeEmail(input.email)}`;
  }
}

export const loginRateLimiter = new LoginRateLimiter({
  maxAttempts: Number.parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS || "", 10) || undefined,
  windowMs: Number.parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || "", 10) || undefined,
});
