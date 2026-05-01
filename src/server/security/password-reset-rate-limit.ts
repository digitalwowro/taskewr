import { RateLimitError } from "@/domain/common/errors";

type PasswordResetRateLimitRecord = {
  count: number;
  resetAt: number;
};

export type PasswordResetRateLimitConfig = {
  maxRequests?: number;
  windowMs?: number;
  now?: () => number;
};

const DEFAULT_MAX_REQUESTS = 3;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export class PasswordResetRateLimiter {
  private readonly records = new Map<string, PasswordResetRateLimitRecord>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly now: () => number;

  constructor(config: PasswordResetRateLimitConfig = {}) {
    this.maxRequests = config.maxRequests ?? DEFAULT_MAX_REQUESTS;
    this.windowMs = config.windowMs ?? DEFAULT_WINDOW_MS;
    this.now = config.now ?? Date.now;
  }

  consume(input: { email: string; ip: string }) {
    const now = this.now();
    const key = `${input.ip}:${normalizeEmail(input.email)}`;
    const current = this.records.get(key);
    const next =
      current && current.resetAt > now
        ? {
            ...current,
            count: current.count + 1,
          }
        : {
            count: 1,
            resetAt: now + this.windowMs,
          };

    this.records.set(key, next);

    if (next.count > this.maxRequests) {
      throw new RateLimitError(
        "Too many password reset requests. Please wait and try again.",
        "password_reset_rate_limited",
      );
    }
  }

  clear() {
    this.records.clear();
  }
}

export const passwordResetRateLimiter = new PasswordResetRateLimiter({
  maxRequests: Number.parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_MAX_REQUESTS || "", 10) || undefined,
  windowMs: Number.parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS || "", 10) || undefined,
});
