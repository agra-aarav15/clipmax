import { z } from "zod";

import {
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_SOURCE_BYTES,
  MAX_SOURCE_DURATION_SECONDS,
  creditsForDurationSeconds,
} from "./credits";
import type { ClipRenderStatus, JobStatus, JobType, ProjectStatus } from "./status";

/** Stable machine-readable error codes. The UI switches on these, never on message text. */
export const API_ERROR_CODES = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_ERROR",
  "PLAN_LIMIT_REACHED",
  "INSUFFICIENT_CREDITS",
  "UPLOAD_NOT_FOUND",
  "UPLOAD_TOO_LARGE",
  "UNSUPPORTED_MEDIA_TYPE",
  "UNSUPPORTED_SOURCE",
  "PROJECT_NOT_READY",
  "RENDER_IN_PROGRESS",
  "RATE_LIMITED",
  "CONFIGURATION_ERROR",
  "INTERNAL_ERROR",
  "NOT_IMPLEMENTED",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum(API_ERROR_CODES),
    message: z.string().min(1),
    details: z.unknown().optional(),
  }),
});

export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

/* ── Captions ─────────────────────────────────────────────────────────── */

export const CAPTION_PRESETS = ["beast_bold"] as const;

export type CaptionPreset = (typeof CAPTION_PRESETS)[number];

/**
 * Mirrors the `clips.caption_style` JSONB default.
 * snake_case is intentional: these keys are persisted verbatim.
 */
export interface CaptionStyle {
  preset: CaptionPreset;
  font_size: number;
  highlight_color: string;
}

export const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  preset: "beast_bold",
  font_size: 24,
  highlight_color: "#9BE7FF",
};

export const captionStyleSchema = z.object({
  preset: z.enum(CAPTION_PRESETS),
  font_size: z.number().int().min(12).max(96),
  highlight_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "highlight_color must be a 6-digit hex color"),
});

/* ── Upload / projects ────────────────────────────────────────────────── */

export const presignRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  fileType: z.enum(ALLOWED_VIDEO_MIME_TYPES),
  fileSize: z.number().int().positive().max(MAX_SOURCE_BYTES),
});

export type PresignRequest = z.infer<typeof presignRequestSchema>;

/**
 * Public-link intake is deliberately allowlisted. The worker runs yt-dlp, so accepting arbitrary
 * hosts would be an SSRF surface (metadata endpoints, localhost, private networks).
 */
export const SUPPORTED_SOURCE_HOSTS = [
  "youtube.com",
  "youtu.be",
  "instagram.com",
  "tiktok.com",
  "vimeo.com",
  "x.com",
  "twitter.com",
  "facebook.com",
  "fb.watch",
  "linkedin.com",
  "twitch.tv",
] as const;

export function isSupportedSourceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const hostname = url.hostname.toLowerCase();
    return SUPPORTED_SOURCE_HOSTS.some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`),
    );
  } catch {
    return false;
  }
}

export const linkProjectRequestSchema = z.object({
  url: z.url().max(2048).refine(isSupportedSourceUrl, {
    message:
      "Paste a public YouTube, Instagram, TikTok, Vimeo, X, Facebook, LinkedIn, or Twitch link.",
  }),
});

export type LinkProjectRequest = z.infer<typeof linkProjectRequestSchema>;

export interface PresignResponse {
  projectId: string;
  /** R2 object key. The URL is never stored; keys are the source of truth. */
  storagePath: string;
  uploadUrl: string;
  method: "PUT";
  /** Must be sent exactly as returned or the signature check fails. */
  headers: Record<string, string>;
  expiresAt: string;
  /** Server-computed maximum spend for this upload, in credits. */
  maxCredits: number;
}

export interface InitiateProcessingResponse {
  projectId: string;
  status: ProjectStatus;
  jobId: string | null;
}

export const projectPatchSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export type ProjectPatch = z.infer<typeof projectPatchSchema>;

export interface ProjectSummary {
  id: string;
  title: string;
  status: ProjectStatus;
  durationSeconds: number;
  clipCount: number;
  creditsCharged: number;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ── Clips ────────────────────────────────────────────────────────────── */

export const clipPatchSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    hookText: z.string().trim().max(140).optional(),
    startTime: z.number().min(0).optional(),
    endTime: z.number().min(0).optional(),
    captionStyle: captionStyleSchema.optional(),
  })
  .refine(
    (value) =>
      value.startTime === undefined ||
      value.endTime === undefined ||
      value.endTime > value.startTime,
    { message: "endTime must be greater than startTime", path: ["endTime"] },
  );

export type ClipPatch = z.infer<typeof clipPatchSchema>;

export const renderClipRequestSchema = z.object({
  captionStyle: captionStyleSchema.optional(),
});

export type RenderClipRequest = z.infer<typeof renderClipRequestSchema>;

export interface ClipSummary {
  id: string;
  projectId: string;
  title: string;
  hookText: string | null;
  startTime: number;
  endTime: number;
  viralityScore: number | null;
  reasoning: string | null;
  renderStatus: ClipRenderStatus;
  renderVersion: number;
  captionStyle: CaptionStyle;
  /** Short-lived signed URLs, minted per request. Never persist these. */
  previewUrl: string | null;
  thumbnailUrl: string | null;
}

export interface ClipJobSummary {
  id: string;
  jobType: JobType;
  status: JobStatus;
  progressPercent: number;
  errorMessage: string | null;
}

/** Result of validating a source duration against the credit balance. */
export interface CreditQuote {
  durationSeconds: number;
  creditsRequired: number;
  balance: number;
  affordable: boolean;
}

/* ── Billing ──────────────────────────────────────────────────────────── */

/** Everything the browser needs to open Razorpay Checkout. No secret is included. */
export interface BillingCheckoutResponse {
  keyId: string;
  subscriptionId: string;
  planName: string;
  credits: number;
  testMode: boolean;
}

export interface BillingVerifyResponse {
  verified: boolean;
  /** True once the webhook has stored the subscription and granted the cycle's credits. */
  granted: boolean;
}

export function quoteCredits(durationSeconds: number, balance: number): CreditQuote {
  const creditsRequired = creditsForDurationSeconds(durationSeconds);
  return {
    durationSeconds,
    creditsRequired,
    balance,
    affordable: balance >= creditsRequired,
  };
}

export const SOURCE_LIMITS = {
  maxBytes: MAX_SOURCE_BYTES,
  maxDurationSeconds: MAX_SOURCE_DURATION_SECONDS,
} as const;
