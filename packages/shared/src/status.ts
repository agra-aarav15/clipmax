/**
 * Canonical state machines for ClipMax.
 *
 * These unions mirror the Postgres CHECK constraints in `supabase/migrations`.
 * If a value changes here it must change in the migration in the same commit.
 */

export const PROJECT_STATUSES = [
  "uploading",
  "ready",
  "processing",
  "completed",
  "failed",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_SOURCE_TYPES = ["upload", "public_url"] as const;

export type ProjectSourceType = (typeof PROJECT_SOURCE_TYPES)[number];

export const JOB_TYPES = ["transcribe", "detect_highlights", "render_clip"] as const;

export type JobType = (typeof JOB_TYPES)[number];

export const JOB_STATUSES = ["queued", "in_progress", "completed", "failed"] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const CLIP_RENDER_STATUSES = ["draft", "queued", "rendering", "rendered", "failed"] as const;

export type ClipRenderStatus = (typeof CLIP_RENDER_STATUSES)[number];

export const PLAN_TIERS = ["free", "starter", "pro"] as const;

export type PlanTier = (typeof PLAN_TIERS)[number];

export const SUBSCRIPTION_STATUSES = ["active", "past_due", "canceled"] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/**
 * The four steps shown in the dashboard progress rail.
 * `upload` is driven by the project row; the other three map 1:1 to job types.
 */
export const PIPELINE_STEPS = [
  {
    key: "upload",
    label: "Uploading",
    description: "Source video is transferring directly to private R2 storage.",
  },
  {
    key: "transcribe",
    label: "Transcribing",
    description: "Audio is extracted and transcribed with word-level timestamps.",
  },
  {
    key: "detect_highlights",
    label: "Analyzing hooks",
    description: "Transcript is scored for viral moments and cut boundaries.",
  },
  {
    key: "render_clip",
    label: "Rendering",
    description: "Clips are cropped to 9:16 with burned-in animated captions.",
  },
] as const;

export type PipelineStepKey = (typeof PIPELINE_STEPS)[number]["key"];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  uploading: "Uploading",
  ready: "Queued",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  queued: "Queued",
  in_progress: "In progress",
  completed: "Completed",
  failed: "Failed",
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  transcribe: "Transcribing",
  detect_highlights: "Analyzing hooks",
  render_clip: "Rendering",
};

export const CLIP_RENDER_STATUS_LABELS: Record<ClipRenderStatus, string> = {
  draft: "Draft",
  queued: "Queued",
  rendering: "Rendering",
  rendered: "Rendered",
  failed: "Failed",
};

/** `true` while the project is still expected to change without user action. */
export function isActiveProjectStatus(status: ProjectStatus): boolean {
  return status === "uploading" || status === "ready" || status === "processing";
}

export function isActiveJobStatus(status: JobStatus): boolean {
  return status === "queued" || status === "in_progress";
}

/** Index of a step in the dashboard rail, or -1 for an unknown key. */
export function pipelineStepIndex(key: PipelineStepKey): number {
  return PIPELINE_STEPS.findIndex((step) => step.key === key);
}

/**
 * Maps a project status onto the rail.
 * `null` means "do not show a rail" (completed/failed are terminal states).
 */
export function projectStatusToStep(status: ProjectStatus): PipelineStepKey | null {
  switch (status) {
    case "uploading":
      return "upload";
    case "ready":
      return "transcribe";
    case "processing":
      return "detect_highlights";
    case "completed":
    case "failed":
      return null;
  }
}
