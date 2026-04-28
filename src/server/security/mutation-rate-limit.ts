import { RateLimitError } from "@/domain/common/errors";
import { AuthService } from "@/server/services/auth-service";
import { getClientIp } from "@/server/security/login-rate-limit";

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

export type FixedWindowRateLimiterConfig = {
  maxRequests?: number;
  windowMs?: number;
  now?: () => number;
};

type MutationRateLimitAuthService = Pick<AuthService, "getSession">;

const DEFAULT_MAX_REQUESTS = 300;
const DEFAULT_WINDOW_MS = 5 * 60 * 1000;

export class FixedWindowRateLimiter {
  private readonly records = new Map<string, RateLimitRecord>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly now: () => number;

  constructor(config: FixedWindowRateLimiterConfig = {}) {
    this.maxRequests = config.maxRequests ?? DEFAULT_MAX_REQUESTS;
    this.windowMs = config.windowMs ?? DEFAULT_WINDOW_MS;
    this.now = config.now ?? Date.now;
  }

  consume(key: string) {
    const now = this.now();
    const current = this.records.get(key);
    const record =
      current && current.resetAt > now
        ? {
            ...current,
            count: current.count + 1,
          }
        : {
            count: 1,
            resetAt: now + this.windowMs,
          };

    this.records.set(key, record);

    if (record.count > this.maxRequests) {
      throw new RateLimitError(
        "Too many requests. Please wait and try again.",
        "mutation_rate_limited",
      );
    }
  }

  clear() {
    this.records.clear();
  }
}

export const mutationRateLimiter = new FixedWindowRateLimiter({
  maxRequests: Number.parseInt(process.env.MUTATION_RATE_LIMIT_MAX_REQUESTS || "", 10) || undefined,
  windowMs: Number.parseInt(process.env.MUTATION_RATE_LIMIT_WINDOW_MS || "", 10) || undefined,
});

export async function assertMutationRateLimit(
  request: Request,
  scope: string,
  authService: MutationRateLimitAuthService = new AuthService(),
  rateLimiter = mutationRateLimiter,
) {
  const session = await authService.getSession();
  const actorKey = session
    ? `user:${session.userId}:workspace:${session.workspaceId}`
    : `ip:${getClientIp(request.headers)}`;

  rateLimiter.consume(`${scope}:${actorKey}`);
}
