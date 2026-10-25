import type { PlanTier } from "./status";

/**
 * Credit model (locked):
 *   1 credit = 1 minute of source video
 *   Credits are charged per project, rounded up, minimum 1.
 *   A 15-minute source costs 15 credits.
 */
export const CREDITS_PER_VIDEO_MINUTE = 1;

export const MAX_SOURCE_DURATION_MINUTES = 15;
export const MAX_SOURCE_DURATION_SECONDS = MAX_SOURCE_DURATION_MINUTES * 60;
export const MAX_SOURCE_BYTES = 500 * 1024 * 1024;

/** Presigned PUT lifetime — 15 minutes. */
export const PRESIGN_PUT_TTL_SECONDS = 15 * 60;
/** Signed GET lifetime for previews and downloads — 60 minutes. */
export const SIGNED_GET_TTL_SECONDS = 60 * 60;

export const ALLOWED_VIDEO_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;

export type AllowedVideoMimeType = (typeof ALLOWED_VIDEO_MIME_TYPES)[number];

export const ALLOWED_VIDEO_EXTENSIONS = ["mp4", "mov", "webm"] as const;

export type AllowedVideoExtension = (typeof ALLOWED_VIDEO_EXTENSIONS)[number];

export const EXTENSION_TO_MIME: Record<AllowedVideoExtension, AllowedVideoMimeType> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

export const MIME_TO_EXTENSION: Record<AllowedVideoMimeType, AllowedVideoExtension> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

/** Credits required to process a source of the given duration. */
export function creditsForDurationSeconds(durationSeconds: number): number {
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
    throw new RangeError("durationSeconds must be a finite, non-negative number");
  }
  const minutes = Math.ceil(durationSeconds / 60);
  return Math.max(1, minutes) * CREDITS_PER_VIDEO_MINUTE;
}

export function minutesForCredits(credits: number): number {
  return credits / CREDITS_PER_VIDEO_MINUTE;
}

export interface PlanPricing {
  /** USD in minor units (cents). */
  usdCents: number;
  /** INR in minor units (paise). */
  inrPaise: number;
}

export interface PlanDefinition {
  tier: "free" | "starter";
  name: string;
  tagline: string;
  creditsPerMonth: number;
  price: PlanPricing;
  /** Env var holding the Razorpay plan id, or null for plans that cannot be purchased. */
  razorpayPlanEnvVar: string | null;
  features: readonly string[];
}

/** Plans that are actually sold. `pro` exists in the DB enum but is not offered yet. */
export const OFFERED_PLAN_TIERS = ["free", "starter"] as const;

export type OfferedPlanTier = (typeof OFFERED_PLAN_TIERS)[number];

export const PLAN_CATALOG: Record<OfferedPlanTier, PlanDefinition> = {
  free: {
    tier: "free",
    name: "Free",
    tagline: "Try the full pipeline on short sources.",
    creditsPerMonth: 30,
    price: { usdCents: 0, inrPaise: 0 },
    razorpayPlanEnvVar: null,
    features: [
      "30 credits to start",
      "1 credit per minute of source video",
      "Up to 15 minutes per source",
      "9:16 exports with burned-in captions",
    ],
  },
  starter: {
    tier: "starter",
    name: "Starter",
    tagline: "For creators publishing every week.",
    creditsPerMonth: 150,
    price: { usdCents: 1900, inrPaise: 149_900 },
    razorpayPlanEnvVar: "RAZORPAY_PLAN_STARTER_MONTHLY",
    features: [
      "150 credits every month",
      "1 credit per minute of source video",
      "Up to 15 minutes per source",
      "Same 9:16 pipeline, five times the headroom",
    ],
  },
};

export function isOfferedPlanTier(tier: PlanTier): tier is OfferedPlanTier {
  return tier === "free" || tier === "starter";
}

export function getPlan(tier: PlanTier): PlanDefinition | null {
  return isOfferedPlanTier(tier) ? PLAN_CATALOG[tier] : null;
}

export function formatPlanPrice(price: PlanPricing, currency: "USD" | "INR"): string {
  const amount = currency === "USD" ? price.usdCents / 100 : price.inrPaise / 100;
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
