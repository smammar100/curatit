// Rate limits per account: 60 reads and 10 briefs a minute, counted in Postgres
// (curatit_rate_limit_hit, service_role only) so every replica shares one count, and at most 5
// calls in flight per account per replica. If the counter can't be reached, or doesn't answer
// within 1.5 s, reads carry on (they're cheap and the catalog would fail too) and briefs are
// refused, so an outage never makes the expensive operation unlimited and a hung counter never
// holds a call up.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { CuratitError } from "./errors";
import type { Logger } from "./log";

export type LimitKind = "read" | "brief";
export const LIMITS: Record<LimitKind, { limit: number; windowSeconds: number }> = {
  read: { limit: 60, windowSeconds: 60 },
  brief: { limit: 10, windowSeconds: 60 },
};
export const MAX_CONCURRENT = 5;
// How long a call waits for the shared counter before treating it as unavailable
export const LIMITER_TIMEOUT_MS = 1_500;

export type RateLimiter = {
  hit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }>;
};

export function createSupabaseLimiter(admin: SupabaseClient<Database>): RateLimiter {
  return {
    async hit(key, limit, windowSeconds) {
      const { data, error } = await admin.rpc("curatit_rate_limit_hit", { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
      if (error) throw new Error(error.message);
      const row = data as { allowed: boolean; remaining: number; retry_after: number };
      return { allowed: row.allowed, remaining: row.remaining, retryAfterSeconds: row.retry_after };
    },
  };
}

// One process only; for tests and as the fallback when the database limiter is down
export function createMemoryLimiter(now: () => number = Date.now): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();
  return {
    async hit(key, limit, windowSeconds) {
      const t = now();
      let w = windows.get(key);
      if (!w || t - w.start >= windowSeconds * 1000) {
        w = { start: t, count: 0 };
        windows.set(key, w);
      }
      w.count++;
      const retryAfterSeconds = Math.max(1, Math.ceil((w.start + windowSeconds * 1000 - t) / 1000));
      return { allowed: w.count <= limit, remaining: Math.max(0, limit - w.count), retryAfterSeconds };
    },
  };
}

// The limiter's answer, or a rejection once `ms` have passed without one
function within<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`no answer within ${ms} ms`)), ms);
  });
  return Promise.race([promise, late]).finally(() => clearTimeout(timer));
}

export class Throttle {
  private inFlight = new Map<string, number>();
  constructor(
    private limiter: RateLimiter,
    private log: Logger,
    private maxConcurrent = MAX_CONCURRENT,
    private limiterTimeoutMs = LIMITER_TIMEOUT_MS,
  ) {}

  private free(subject: string) {
    const n = (this.inFlight.get(subject) ?? 1) - 1;
    if (n <= 0) this.inFlight.delete(subject);
    else this.inFlight.set(subject, n);
  }

  // Takes a slot for `subject` or throws RATE_LIMITED; release() gives the concurrency slot back.
  // The slot is reserved before the counter is asked, so calls that arrive together can't all
  // pass the check while each waits for its answer; a refusal hands it straight back.
  async acquire(subject: string, kind: LimitKind): Promise<() => void> {
    const current = this.inFlight.get(subject) ?? 0;
    if (current >= this.maxConcurrent) {
      throw new CuratitError("RATE_LIMITED", `At most ${this.maxConcurrent} calls at once per account. Wait for one to finish.`, { retryAfterSeconds: 1 });
    }
    this.inFlight.set(subject, current + 1);
    const { limit, windowSeconds } = LIMITS[kind];
    let verdict: Awaited<ReturnType<RateLimiter["hit"]>>;
    try {
      verdict = await within(this.limiter.hit(`${kind}:${subject}`, limit, windowSeconds), this.limiterTimeoutMs);
    } catch (error) {
      this.log.warn("ratelimit.store_unavailable", { kind, error: String(error) });
      if (kind === "brief") {
        this.free(subject);
        throw new CuratitError("UPSTREAM_UNAVAILABLE", "Brief creation is paused while the rate limiter is unavailable. Try again shortly.", { retryAfterSeconds: 30, cause: { stage: "rate_limit", message: String(error) } });
      }
      verdict = { allowed: true, remaining: limit, retryAfterSeconds: 0 };
    }
    if (!verdict.allowed) {
      this.free(subject);
      throw new CuratitError("RATE_LIMITED", `Request limit reached (${limit} ${kind === "brief" ? "briefs" : "reads"} a minute). Retry after ${verdict.retryAfterSeconds} seconds.`, {
        retryAfterSeconds: verdict.retryAfterSeconds,
      });
    }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.free(subject);
    };
  }
}
