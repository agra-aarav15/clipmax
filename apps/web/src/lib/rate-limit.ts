import type { SupabaseClient } from "@supabase/supabase-js";

import { AppError } from "@/lib/api/errors";

/**
 * Fixed-window rate limits for authenticated, abusable API routes.
 *
 * One call is one database round trip: `consume_rate_limit` increments the window atomically and
 * returns the decision. Limits are per user, per route, and are deliberately generous — they stop
 * runaway loops and credit probes, not normal use.
 */
export const RATE_LIMITS = {
  presign: { bucket: "uploads:presign", limit: 30, windowSeconds: 60 * 60 },
  initiate: { bucket: "projects:initiate", limit: 40, windowSeconds: 60 * 60 },
  link: { bucket: "projects:link", limit: 20, windowSeconds: 60 * 60 },
  retry: { bucket: "projects:retry", limit: 20, windowSeconds: 60 * 60 },
  checkout: { bucket: "billing:checkout", limit: 10, windowSeconds: 60 * 60 },
  verify: { bucket: "billing:verify", limit: 30, windowSeconds: 60 * 60 },
} as const satisfies Record<string, { bucket: string; limit: number; windowSeconds: number }>;

type RateLimitRule = (typeof RATE_LIMITS)[keyof typeof RATE_LIMITS];

type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Throws `RATE_LIMITED` when the caller has used its window.
 *
 * If the limiter itself is unavailable (migration not applied yet), the request is allowed and the
 * failure is logged. A missing hardening migration must not take down uploads, renders, or billing;
 * the deployment runbook applies migrations before the app is promoted.
 */
export async function enforceRateLimit(
  admin: SupabaseClient,
  rule: RateLimitRule,
  userId: string,
): Promise<void> {
  const { data, error } = await admin.rpc("consume_rate_limit", {
    p_bucket: `${rule.bucket}:${userId}`,
    p_limit: rule.limit,
    p_window_seconds: rule.windowSeconds,
  });

  if (error) {
    console.error(`[rate-limit] ${rule.bucket} limiter unavailable; allowing the request`, {
      code: error.code,
      message: error.message,
    });
    return;
  }

  const decision = data as RateLimitDecision | null;
  if (!decision || typeof decision.allowed !== "boolean") {
    console.error(`[rate-limit] ${rule.bucket} returned an unexpected decision; allowing`, data);
    return;
  }

  if (!decision.allowed) {
    const minutes = Math.max(1, Math.ceil(decision.retryAfterSeconds / 60));
    throw new AppError(
      "RATE_LIMITED",
      `Too many requests. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`,
      {
        details: {
          limit: decision.limit,
          retryAfterSeconds: decision.retryAfterSeconds,
        },
      },
    );
  }
}
