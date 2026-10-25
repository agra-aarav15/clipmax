import {
  MAX_SOURCE_DURATION_MINUTES,
  PIPELINE_STEPS,
  PROJECT_STATUS_LABELS,
  isActiveProjectStatus,
  type ClipRenderStatus,
  type JobStatus,
  type JobType,
  type ProjectSourceType,
  type ProjectStatus,
} from "@clipmax/shared";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CaptionsIcon,
  CheckIcon,
  CircleIcon,
  Clock3Icon,
  FileVideoIcon,
  Loader2Icon,
  SettingsIcon,
  SparklesIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { ClipCard, type ClipView } from "@/components/studio/clip-card";
import { DeleteProjectButton } from "@/components/studio/delete-project-button";
import { ProjectPoller } from "@/components/studio/project-poller";
import { ProjectStatusBadge } from "@/components/studio/status-badge";
import { RetryProjectButton } from "@/components/studio/retry-project-button";
import { StudioConfigurationState } from "@/components/studio/configuration-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes, formatDate, formatDateTime, formatTimecode } from "@/lib/format";
import { isUuid } from "@/lib/ids";
import { isR2Configured, presignGet } from "@/lib/r2";
import { getCurrentUser } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Project",
  robots: { index: false, follow: false },
};

const REQUIRED_STUDIO_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
] as const;

type ProjectRow = {
  id: string;
  title: string;
  status: ProjectStatus;
  source_type: ProjectSourceType;
  source_url: string | null;
  storage_path: string | null;
  original_filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  duration_seconds: number | string | null;
  credits_reserved: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

type JobRow = {
  id: string;
  job_type: JobType;
  status: JobStatus;
  progress_percent: number;
  error_message: string | null;
  attempts: number;
  created_at: string;
  updated_at: string;
};

type ClipRow = {
  id: string;
  title: string;
  hook_text: string | null;
  start_time: number | string;
  end_time: number | string;
  virality_score: number | null;
  reasoning: string | null;
  render_status: ClipRenderStatus;
  storage_path: string | null;
  thumbnail_path: string | null;
};

type TranscriptRow = {
  text: string;
  language: string | null;
  provider: string | null;
};

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function pipelineProgress(project: ProjectRow, jobs: JobRow[]): number {
  if (project.status === "completed") return 100;
  if (project.status === "uploading" || project.status === "ready") return 0;

  const job =
    [...jobs].reverse().find((item) => item.status === "in_progress") ??
    [...jobs].reverse().find((item) => item.status === "queued");

  const fallback =
    project.status === "failed"
      ? [...jobs].reverse().find((item) => item.status === "failed")
      : undefined;
  const activeJob = job ?? fallback;

  if (!activeJob) return 0;

  const progress = Math.max(0, Math.min(100, activeJob.progress_percent));
  if (activeJob.job_type === "render_clip") return Math.round(60 + progress * 0.4);
  return Math.round(progress * 0.6);
}

function currentStepIndex(project: ProjectRow, jobs: JobRow[]): number {
  if (project.status === "completed") return PIPELINE_STEPS.length;
  if (project.status === "uploading") return 0;
  if (project.status === "ready") return 1;

  const active =
    [...jobs].reverse().find((job) => job.status === "in_progress") ??
    [...jobs].reverse().find((job) => job.status === "queued");

  if (active?.job_type === "render_clip") return 3;
  if (active?.job_type === "transcribe") {
    return active.progress_percent >= 55 ? 2 : 1;
  }

  if (project.status === "failed") {
    const failed = [...jobs].reverse().find((job) => job.status === "failed");
    if (failed?.job_type === "render_clip") return 3;
    if (failed?.job_type === "transcribe") return failed.progress_percent >= 55 ? 2 : 1;
    return 0;
  }

  return 1;
}

function stepLabels(sourceType: ProjectSourceType) {
  return PIPELINE_STEPS.map((step, index) => {
    if (index !== 0) return step;
    if (sourceType === "public_url") {
      return {
        ...step,
        label: "Fetching source",
        description: "The worker downloads the public link into private R2 storage.",
      };
    }
    return step;
  });
}

function StepIcon({ state }: { state: "done" | "active" | "pending" | "failed" }) {
  if (state === "done") {
    return (
      <span className="grid size-6 place-items-center rounded-full border border-signal/40 bg-signal/10 text-signal">
        <CheckIcon className="size-3.5" />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="grid size-6 place-items-center rounded-full border border-signal/50 bg-signal/10 text-signal">
        <Loader2Icon className="size-3.5 animate-spin" />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span className="grid size-6 place-items-center rounded-full border border-destructive/40 bg-destructive/10 text-destructive">
        <AlertTriangleIcon className="size-3.5" />
      </span>
    );
  }
  return (
    <span className="grid size-6 place-items-center rounded-full border border-border bg-background text-muted-foreground">
      <CircleIcon className="size-3" />
    </span>
  );
}

function StepState({
  index,
  current,
  failedIndex,
  project,
}: {
  index: number;
  current: number;
  failedIndex: number;
  project: ProjectRow;
}) {
  if (project.status === "failed" && index === failedIndex) return "failed" as const;
  if (project.status === "completed" || index < current) return "done" as const;
  if (project.status !== "failed" && index === current) return "active" as const;
  return "pending" as const;
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isUuid(id)) notFound();

  const { supabase, user } = await getCurrentUser();

  if (!supabase) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="font-mono text-[0.625rem] tracking-[0.2em] text-signal uppercase">Studio</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Your studio is not connected.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Add the Supabase credentials to load a real project. This page never invents clip data.
          </p>
        </div>
        <StudioConfigurationState keys={REQUIRED_STUDIO_KEYS} />
      </div>
    );
  }

  if (!user) redirect(`/signup?next=${encodeURIComponent(`/dashboard/projects/${id}`)}`);

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      "id, title, status, source_type, source_url, storage_path, original_filename, mime_type, size_bytes, duration_seconds, credits_reserved, error_message, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle<ProjectRow>();

  if (projectError) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card className="border-destructive/25 bg-destructive/[0.04]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="size-4 text-destructive" />
              <CardTitle>Could not load this project</CardTitle>
            </div>
            <CardDescription>{projectError.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard"
              className="text-sm text-signal underline-offset-4 hover:underline"
            >
              Back to the studio
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) notFound();

  const [
    { data: jobRows, error: jobsError },
    { data: clipRows, error: clipsError },
    { data: transcript, error: transcriptError },
  ] = await Promise.all([
    supabase
      .from("processing_jobs")
      .select(
        "id, job_type, status, progress_percent, error_message, attempts, created_at, updated_at",
      )
      .eq("project_id", id)
      .order("created_at", { ascending: true })
      .returns<JobRow[]>(),
    supabase
      .from("clips")
      .select(
        "id, title, hook_text, start_time, end_time, virality_score, reasoning, render_status, storage_path, thumbnail_path",
      )
      .eq("project_id", id)
      .order("start_time", { ascending: true })
      .returns<ClipRow[]>(),
    supabase
      .from("transcripts")
      .select("text, language, provider")
      .eq("project_id", id)
      .maybeSingle<TranscriptRow>(),
  ]);

  const jobs = jobRows ?? [];
  const clips = clipRows ?? [];
  const duration = toNumber(project.duration_seconds);
  const active = isActiveProjectStatus(project.status);
  const polling = project.status === "ready" || project.status === "processing";
  const current = currentStepIndex(project, jobs);
  const failedIndex = current;
  const steps = stepLabels(project.source_type);
  const progress = pipelineProgress(project, jobs);
  const failedJob = [...jobs].reverse().find((job) => job.status === "failed");

  const r2Ready = isR2Configured();

  const signedClips = await Promise.all(
    clips.map(async (clip) => {
      let previewUrl: string | null = null;
      let thumbnailUrl: string | null = null;
      let signError = false;

      if (r2Ready && clip.render_status === "rendered") {
        try {
          if (clip.storage_path) previewUrl = await presignGet(clip.storage_path);
          if (clip.thumbnail_path) thumbnailUrl = await presignGet(clip.thumbnail_path);
        } catch {
          signError = true;
        }
      } else if (r2Ready && clip.thumbnail_path) {
        try {
          thumbnailUrl = await presignGet(clip.thumbnail_path);
        } catch {
          signError = true;
        }
      }

      const view: ClipView = {
        id: clip.id,
        title: clip.title,
        hookText: clip.hook_text,
        startTime: toNumber(clip.start_time) ?? 0,
        endTime: toNumber(clip.end_time) ?? 0,
        viralityScore: clip.virality_score,
        reasoning: clip.reasoning,
        renderStatus: clip.render_status,
        previewUrl,
        thumbnailUrl,
      };

      return { view, signError };
    }),
  );

  const clipViews = signedClips.map((item) => item.view);
  const signingFailed = signedClips.some((item) => item.signError);

  const renderedCount = clipViews.filter((clip) => clip.renderStatus === "rendered").length;
  const sourceLabel =
    project.source_type === "public_url"
      ? "Public link"
      : (project.original_filename ?? project.mime_type ?? "Upload");

  return (
    <div className="mx-auto max-w-6xl">
      <ProjectPoller active={polling} />

      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-muted-foreground"
      >
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          Studio
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-foreground">{project.title}</span>
      </nav>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{project.title}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.6875rem] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <FileVideoIcon className="size-3.5" />
              {sourceLabel}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatDate(project.created_at)}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3Icon className="size-3.5" />
              {duration === null ? "Duration pending" : formatTimecode(duration)}
            </span>
            {project.size_bytes ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{formatBytes(project.size_bytes)}</span>
              </>
            ) : null}
            <span aria-hidden="true">·</span>
            <span>{project.credits_reserved} credits held</span>
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <DeleteProjectButton projectId={project.id} title={project.title} />
          {project.status === "failed" ? <RetryProjectButton projectId={project.id} /> : null}
        </div>
      </div>

      {jobsError ? (
        <Banner tone="danger" title="Could not load job status">
          {jobsError.message}
        </Banner>
      ) : null}
      {clipsError ? (
        <Banner tone="danger" title="Could not load clips">
          {clipsError.message}
        </Banner>
      ) : null}
      {transcriptError ? (
        <Banner tone="danger" title="Could not load the transcript">
          {transcriptError.message}
        </Banner>
      ) : null}
      {!r2Ready ? (
        <Banner tone="warning" title="Previews and downloads are not connected">
          Cloudflare R2 is not configured in this process. The project rows are real, but signed
          playback and downloads cannot be minted until the R2 keys are present.
        </Banner>
      ) : null}
      {r2Ready && signingFailed ? (
        <Banner tone="warning" title="Some preview URLs could not be signed">
          The clips exist, but R2 rejected at least one signing request. Reload once, then check the
          bucket credentials if it persists.
        </Banner>
      ) : null}

      {project.status === "failed" ? (
        <Card className="mt-6 border-destructive/25 bg-destructive/[0.04]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="size-4 text-destructive" />
              <CardTitle>The pipeline stopped</CardTitle>
            </div>
            <CardDescription>
              {project.error_message ??
                failedJob?.error_message ??
                "The worker reported a failure without a message."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              The credit hold was refunded when the job became terminal. A retry starts a fresh
              reservation, re-probes the source, and replaces the drafts from this attempt.
            </p>
            <RetryProjectButton projectId={project.id} />
          </CardContent>
        </Card>
      ) : null}

      {project.status === "uploading" ? (
        <Banner tone="warning" title="This upload never finished">
          The object was not verified in R2, so no credits were charged and no worker job exists.
          Start a new upload from the studio, or delete this row.
        </Banner>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0">
          <section aria-labelledby="clips-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[0.625rem] tracking-[0.2em] text-signal uppercase">
                  Output
                </p>
                <h2 id="clips-title" className="mt-1.5 text-xl font-semibold tracking-tight">
                  {renderedCount > 0
                    ? `${renderedCount} ${renderedCount === 1 ? "clip" : "clips"} ready`
                    : "Clips"}
                </h2>
              </div>
              {active ? (
                <span className="inline-flex items-center gap-2 font-mono text-[0.625rem] tracking-[0.1em] text-signal uppercase">
                  <Loader2Icon className="size-3.5 animate-spin" />
                  Live from the queue
                </span>
              ) : null}
            </div>

            {clipViews.length > 0 ? (
              <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {clipViews.map((clip, index) => (
                  <ClipCard
                    key={clip.id}
                    clip={clip}
                    index={index}
                    hasTranscript={Boolean(transcript?.text)}
                  />
                ))}
              </div>
            ) : (
              <Card className="mt-4">
                <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
                  <div className="grid size-12 place-items-center rounded-full border border-signal/20 bg-signal/[0.06]">
                    {project.status === "completed" ? (
                      <AlertTriangleIcon className="size-5 text-amber-300" />
                    ) : (
                      <SparklesIcon className="size-5 text-signal" />
                    )}
                  </div>
                  <p className="mt-4 text-sm font-medium">
                    {project.status === "completed"
                      ? "The job completed without published clips."
                      : project.status === "failed"
                        ? "No clips survived this attempt."
                        : "The first clip will land here."}
                  </p>
                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                    {project.status === "completed"
                      ? "That is a real inconsistency, not an empty sample state. Retry the source or contact support with this project id."
                      : project.status === "failed"
                        ? "Retry the project above. The pipeline will replace the drafts from the failed attempt."
                        : "The worker is reading the source and selecting moments. This page refreshes while the queue is moving."}
                  </p>
                </CardContent>
              </Card>
            )}
          </section>

          {transcript?.text ? (
            <section
              id="transcript"
              aria-labelledby="transcript-title"
              className="mt-8 scroll-mt-24"
            >
              <details className="group rounded-xl border border-border bg-card">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <h2 id="transcript-title" className="text-sm font-medium">
                      Transcript
                    </h2>
                    <p className="mt-0.5 font-mono text-[0.625rem] tracking-[0.08em] text-muted-foreground uppercase">
                      {transcript.language ?? "Unknown language"}
                      {transcript.provider ? ` · ${transcript.provider}` : ""}
                    </p>
                  </div>
                  <span className="font-mono text-[0.625rem] text-muted-foreground group-open:hidden">
                    Open
                  </span>
                  <span className="hidden font-mono text-[0.625rem] text-muted-foreground group-open:inline">
                    Close
                  </span>
                </summary>
                <div className="max-h-96 overflow-y-auto border-t border-border/70 px-5 py-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                    {transcript.text}
                  </p>
                </div>
              </details>
            </section>
          ) : null}
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b border-border/70 py-4">
              <CardTitle className="text-sm">Pipeline</CardTitle>
              <CardDescription className="mt-1 text-xs">
                Every state below comes from the project and job rows.
              </CardDescription>
            </CardHeader>
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[0.625rem] tracking-[0.12em] text-muted-foreground uppercase">
                  {project.status === "completed"
                    ? "Complete"
                    : project.status === "failed"
                      ? "Stopped"
                      : PROJECT_STATUS_LABELS[project.status]}
                </span>
                <span className="font-mono text-xs text-signal">{progress}%</span>
              </div>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label="Pipeline progress from the job rows"
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-700",
                    project.status === "failed" ? "bg-destructive" : "bg-signal",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-[0.625rem] leading-relaxed text-muted-foreground">
                Derived from the active job&apos;s progress. It does not advance on its own.
              </p>

              <ol className="mt-5 space-y-4">
                {steps.map((step, index) => {
                  const state = StepState({ index, current, failedIndex, project });
                  return (
                    <li key={step.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <StepIcon state={state} />
                        {index < steps.length - 1 ? (
                          <span
                            className={cn(
                              "mt-1 w-px flex-1",
                              state === "done" ? "bg-signal/30" : "bg-border",
                            )}
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 pb-1">
                        <p
                          className={cn(
                            "text-xs font-medium",
                            state === "pending" && "text-muted-foreground",
                            state === "failed" && "text-destructive",
                          )}
                        >
                          {step.label}
                        </p>
                        <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {failedJob?.error_message ? (
                <p className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 px-2.5 py-2 text-[0.6875rem] leading-relaxed text-destructive">
                  {failedJob.error_message}
                </p>
              ) : null}

              <div className="mt-5 space-y-2 border-t border-border/70 pt-4">
                <DetailRow label="Source" value={sourceLabel} />
                <DetailRow
                  label="Max source"
                  value={`${MAX_SOURCE_DURATION_MINUTES} min · 500 MB`}
                />
                <DetailRow label="Updated" value={formatDateTime(project.updated_at)} />
                {project.status === "processing" && jobs.length > 0 ? (
                  <DetailRow
                    label="Last job"
                    value={
                      jobs[jobs.length - 1]?.job_type === "render_clip"
                        ? "Rendering"
                        : "Transcription"
                    }
                  />
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b border-border/70 py-4">
              <CardTitle className="text-sm">Captions</CardTitle>
              <CardDescription className="mt-1 text-xs">
                Burned into every rendered frame with FFmpeg and libass.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 py-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <CaptionsIcon className="size-3.5 text-signal" />
                Word-level highlight
              </span>
              <span className="flex items-center gap-2">
                <SettingsIcon className="size-3.5 text-signal" />
                1080 × 1920 · H.264/AAC
              </span>
              <p className="pt-2 leading-relaxed">
                Signed previews expire after 60 minutes. Reload the page for fresh links.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Banner({
  tone,
  title,
  children,
}: {
  tone: "warning" | "danger";
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        "mt-6 flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs leading-relaxed",
        tone === "danger"
          ? "border-destructive/25 bg-destructive/10 text-destructive"
          : "border-amber-300/20 bg-amber-300/[0.04] text-amber-200",
      )}
    >
      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
      <span>
        <span className="font-medium">{title}. </span>
        {children}
      </span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="font-mono text-[0.625rem] tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </span>
      <span className="max-w-[60%] truncate text-right text-[0.6875rem] text-foreground">
        {value}
      </span>
    </div>
  );
}
