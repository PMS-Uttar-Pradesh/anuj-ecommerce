/**
 * lib/rate-limit.ts
 *
 * In-process sliding window rate limiter.
 *
 * ⚠️  SINGLE-PROCESS ONLY — this limiter is backed by an in-memory Map.
 * It is correct for single-instance deployments (local dev, a single server
 * process). On auto-scaled / multi-instance deployments (e.g., Vercel with
 * concurrent Lambda instances) each instance maintains its own independent
 * counter, so the effective limit per user is limit × instance-count.
 *
 * Upgrade path: replace the Map-backed `checkRateLimit` implementation with
 * Upstash Redis + @upstash/ratelimit for distributed enforcement.
 */

import { headers } from "next/headers";

// ── Store ──────────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number; // epoch ms
}

const store = new Map<string, RateLimitEntry>();

// Periodically remove expired entries to prevent unbounded Map growth in
// long-running server processes. .unref() prevents the timer from keeping a
// Node.js process alive after all other work completes.
const _cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000 /* 5 minutes */);

if (
  _cleanupTimer != null &&
  typeof (_cleanupTimer as unknown as { unref?: unknown }).unref === "function"
) {
  (_cleanupTimer as unknown as { unref(): void }).unref();
}

// ── Core rate-limit check ──────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
}

/**
 * Check and record one hit against a rate-limit bucket.
 *
 * @param key      Unique bucket identifier, e.g. "login:user@example.com"
 * @param max      Maximum allowed hits within the window
 * @param windowMs Window size in milliseconds
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // No entry or previous window expired — start fresh
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, resetAt };
  }

  entry.count += 1;

  return {
    allowed: entry.count <= max,
    remaining: Math.max(0, max - entry.count),
    resetAt: entry.resetAt,
  };
}

// ── IP extraction helper ───────────────────────────────────────────────────

/**
 * Extract the best-available client IP from request headers.
 * Works inside Next.js Server Actions and Route Handlers via next/headers.
 * Returns "unknown" when headers are unavailable (e.g. called outside a
 * request context).
 */
export async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    const xff = h.get("x-forwarded-for");
    if (xff) return xff.split(",")[0].trim();
    const realIp = h.get("x-real-ip");
    if (realIp) return realIp.trim();
  } catch {
    // headers() throws outside of an active request context — safe to ignore
  }
  return "unknown";
}
