import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimiter {
  /** Returns true if the request is allowed, false if it should be rejected. */
  check(identifier: string): Promise<boolean>;
}

class InMemoryRateLimiter implements RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  async check(identifier: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const existing = (this.hits.get(identifier) ?? []).filter((timestamp) => timestamp > windowStart);

    if (existing.length >= this.limit) {
      this.hits.set(identifier, existing);
      return false;
    }

    existing.push(now);
    this.hits.set(identifier, existing);
    return true;
  }
}

class UpstashRateLimiter implements RateLimiter {
  private readonly limiter: Ratelimit;

  constructor(limit: number, windowSeconds: number) {
    this.limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    });
  }

  async check(identifier: string): Promise<boolean> {
    const { success } = await this.limiter.limit(identifier);
    return success;
  }
}

/**
 * Falls back to an in-process limiter (fine for local dev / a single
 * instance) when Upstash isn't configured, so auth/checkout rate limiting
 * works out of the box without requiring an Upstash account up front.
 */
export function createRateLimiter(limit: number, windowSeconds: number): RateLimiter {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new UpstashRateLimiter(limit, windowSeconds);
  }

  return new InMemoryRateLimiter(limit, windowSeconds * 1000);
}

export const authRateLimiter = createRateLimiter(10, 60);
