import {
  JOB_TYPE_LABELS,
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
  ArrowUpRightIcon,
  CaptionsIcon,
  CheckIcon,
  CircleIcon,
  FileVideoIcon,
  FilmIcon,
  Loader2Icon,
  ShieldCheckIcon,
  SparklesIcon,
  WalletIcon,
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

type StepState = "done" | "active" | "pending" | "failed";

function stepStateFor(index: number, current: number, project: ProjectRow): StepState {
  if (project.status === "failed" && index === current) return "failed";
  if (project.status === "completed" || index < current) return "done";
  if (project.status !== "failed" && index === current) return "active";
  return "pending";
}

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className="grid size-5 place-items-center rounded-full border border-signal/35 bg-signal/[0.08] text-signal">
        <CheckIcon className="size-3" />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="grid size-5 place-items-center rounded-full border border-signal/45 bg-signal/[0.08] text-signal">
        <Loader2Icon className="size-3 animate-spin" />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span className="grid size-5 place-items-center rounded-full border border-destructive/40 bg-destructive/10 text-red-300">
        <AlertTriangleIcon className="size-3" />
      </span>
    );
  }
  return (
    <span className="grid size-5 place-items-center rounded-full border border-white/[0.09] bg-white/[0.02] text-zinc-600">
      <CircleIcon className="size-2" />
    </span>
  );
}

const JOB_TONE: Record<JobStatus, string> = {
  queued: "text-zinc-400",
  in_progress: "text-signal",
  completed: "text-signal/80",
  failed: "text-red-300",
};

const JOB_LABEL: Record<JobStatus, string> = {
  queued: "Queued",
  in_progress: "Running",
  completed: "Done",
  failed: "Failed",
};

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isUuid(id)) notFound();

  const { supabase, user } = await getCurrentUser();

  if (!supabase) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-[9px] tracking-[0.2em] text-signal uppercase">
          Studio / project
        </p>
        <h1 className="mt-3 text-[clamp(2rem,4vw,3rem)] leading-none font-semibold tracking-[-0.055em]">
          The studio is not connected.
        </h1>
        <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-zinc-400">
          Add the Supabase credentials to load a real project. This page never invents clip data.
        </p>
        <div className="mt-8">
          <StudioConfigurationState keys={REQUIRED_STUDIO_KEYS} />
        </div>
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
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-destructive/25 bg-destructive/[0.05] px-5 py-5">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="size-4 text-red-300" />
            <h1 className="text-[14px] font-medium text-red-100">Could not load this project</h1>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-red-200/75">{projectError.message}</p>
          <Link
            href="/dashboard/projects"
            className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] text-signal underline-offset-4 hover:underline"
          >
            <ArrowLeftIcon className="size-3.5" />
            Back to projects
          </Link>
        </div>
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
  const sourceHref = project.source_type === "public_url" ? project.source_url : null;
  const creditLabel =
    project.status === "completed"
      ? "Credits charged"
      : project.status === "failed"
        ? "Credit hold"
        : "Credits held";
  const creditValue =
    project.status === "failed"
      ? project.credits_reserved > 0
        ? `${project.credits_reserved} · refund pending`
        : "Refunded"
      : `${project.credits_reserved} cr`;

  const pipelineLabel =
    project.status === "completed"
      ? "Complete"
      : project.status === "failed"
        ? "Stopped"
        : PROJECT_STATUS_LABELS[project.status];

  return (
    <div className="mx-auto max-w-[1320px]">
      <ProjectPoller active={polling} />

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2">
        <Link
          href="/dashboard/projects"
          className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[8.5px] tracking-[0.14em] text-zinc-500 uppercase transition-colors hover:text-zinc-200"
        >
          <ArrowLeftIcon className="size-3" />
          Projects
        </Link>
        <span aria-hidden="true" className="text-zinc-700">
          /
        </span>
        <span className="truncate font-mono text-[8.5px] tracking-[0.1em] text-zinc-600 uppercase">
          {project.id.slice(0, 8)}
        </span>
      </nav>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="font-mono text-[9px] tracking-[0.2em] text-signal uppercase">Project</p>
            <span aria-hidden="true" className="h-3 w-px bg-white/10" />
            <ProjectStatusBadge status={project.status} />
          </div>

          <h1 className="mt-3 text-[clamp(1.75rem,3.4vw,2.85rem)] leading-[1.03] font-semibold tracking-[-0.055em] text-balance">
            {project.title}
          </h1>

          <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 font-mono text-[8.5px] tracking-[0.08em] text-zinc-500 uppercase">
            <span className="inline-flex items-center gap-1.5">
              <FileVideoIcon className="size-3 text-zinc-600" />
              {sourceHref ? (
                <a
                  href={sourceHref}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-zinc-400 underline-offset-4 transition-colors hover:text-signal hover:underline"
                >
                  {sourceLabel}
                  <ArrowUpRightIcon className="size-2.5" />
                </a>
              ) : (
                <span className="max-w-[16rem] truncate text-zinc-400">{sourceLabel}</span>
              )}
            </span>
            <span aria-hidden="true" className="text-zinc-700">
              /
            </span>
            <span>{formatDate(project.created_at)}</span>
            <span aria-hidden="true" className="text-zinc-700">
              /
            </span>
            <span>{duration === null ? "Duration pending" : formatTimecode(duration)}</span>
            {project.size_bytes ? (
              <>
                <span aria-hidden="true" className="text-zinc-700">
                  /
                </span>
                <span>{formatBytes(project.size_bytes)}</span>
              </>
            ) : null}
            <span aria-hidden="true" className="text-zinc-700">
              /
            </span>
            <span>{creditValue}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-3">
          <DeleteProjectButton projectId={project.id} title={project.title} />
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
        <section className="mt-6 overflow-hidden rounded-2xl border border-destructive/25 bg-destructive/[0.05]">
          <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-destructive/30 bg-destructive/10">
              <AlertTriangleIcon className="size-3.5 text-red-300" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[13px] font-medium text-red-100">The pipeline stopped</h2>
              <p className="mt-1 max-w-3xl text-[11.5px] leading-relaxed text-red-200/75">
                {project.error_message ??
                  failedJob?.error_message ??
                  "The worker reported a failure without a message."}
              </p>
              <p className="mt-2 text-[10.5px] leading-relaxed text-zinc-500">
                The credit hold is refunded when a job becomes terminal. A retry starts a fresh
                reservation, re-probes the source, and replaces the drafts from this attempt.
              </p>
              <div className="mt-3">
                <RetryProjectButton projectId={project.id} />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {project.status === "uploading" ? (
        <Banner tone="warning" title="This upload never finished">
          The object was not verified in R2, so no credits were charged and no worker job exists.
          Start a new upload from the studio, or delete this row.
        </Banner>
      ) : null}

      <section
        aria-labelledby="pipeline-title"
        className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0a0b]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 rounded-full",
                project.status === "failed"
                  ? "bg-red-400"
                  : project.status === "completed"
                    ? "bg-signal"
                    : "animate-pulse bg-signal",
              )}
            />
            <h2
              id="pipeline-title"
              className="font-mono text-[8px] tracking-[0.2em] text-zinc-500 uppercase"
            >
              Pipeline
            </h2>
            <span className="font-mono text-[9px] tracking-[0.1em] text-zinc-400 uppercase">
              {pipelineLabel}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {polling ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-[8px] tracking-[0.12em] text-signal uppercase">
                <Loader2Icon className="size-3 animate-spin" />
                Live
              </span>
            ) : null}
            <span className="font-mono text-[11px] text-signal tabular">{progress}%</span>
          </div>
        </div>

        <ol className="grid gap-px bg-white/[0.05] sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const state = stepStateFor(index, current, project);
            return (
              <li key={step.key} className="bg-[#0a0a0b] px-4 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[8px] tracking-[0.14em] text-zinc-600">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <StepIcon state={state} />
                </div>
                <p
                  className={cn(
                    "mt-2 text-[11.5px] font-medium",
                    state === "pending" && "text-zinc-500",
                    state === "failed" && "text-red-200",
                    (state === "done" || state === "active") && "text-zinc-200",
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-zinc-600">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>

        <div className="h-0.5 bg-white/[0.04]">
          <div
            className={cn(
              "h-full transition-[width] duration-700",
              project.status === "failed" ? "bg-destructive" : "bg-signal/80",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="px-4 py-2 font-mono text-[8px] tracking-[0.1em] text-zinc-600 uppercase sm:px-5">
          Derived from the active job&apos;s real progress · it does not advance on its own
        </p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0">
          <section aria-labelledby="clips-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[8px] tracking-[0.2em] text-signal uppercase">
                  The cuts
                </p>
                <h2
                  id="clips-title"
                  className="mt-1 text-[19px] font-semibold tracking-[-0.035em]"
                >
                  {renderedCount > 0
                    ? `${renderedCount} ${renderedCount === 1 ? "clip" : "clips"} ready to post`
                    : clipViews.length > 0
                      ? "Clips in progress"
                      : "Clips"}
                </h2>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                  9:16 · burned-in word-level captions · H.264/AAC
                </p>
              </div>
              {active ? (
                <span className="inline-flex items-center gap-1.5 font-mono text-[8px] tracking-[0.12em] text-signal uppercase">
                  <Loader2Icon className="size-3 animate-spin" />
                  Watching the queue
                </span>
              ) : null}
            </div>

            {clipViews.length > 0 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
              <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.09] bg-white/[0.012] px-6 py-14 text-center">
                <div className="grid size-12 place-items-center rounded-full border border-signal/20 bg-signal/[0.06]">
                  {project.status === "completed" ? (
                    <AlertTriangleIcon className="size-5 text-amber-300" />
                  ) : (
                    <SparklesIcon className="size-5 text-signal" />
                  )}
                </div>
                <p className="mt-4 text-[13px] font-medium text-zinc-200">
                  {project.status === "completed"
                    ? "The job completed without published clips."
                    : project.status === "failed"
                      ? "No clips survived this attempt."
                      : "The first clip will land here."}
                </p>
                <p className="mt-1 max-w-sm text-[11.5px] leading-relaxed text-zinc-500">
                  {project.status === "completed"
                    ? "That is a real inconsistency, not an empty sample state. Retry the source or contact support with this project id."
                    : project.status === "failed"
                      ? "Retry the project above. The pipeline will replace the drafts from the failed attempt."
                      : "The worker is reading the source and selecting moments. This page refreshes while the queue is moving."}
                </p>
              </div>
            )}
          </section>

          {transcript?.text ? (
            <section id="transcript" className="mt-8 scroll-mt-24">
              <details className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0a0b]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-white/[0.02] sm:px-5">
                  <div>
                    <h2 className="text-[12.5px] font-medium text-zinc-200">Transcript</h2>
                    <p className="mt-0.5 font-mono text-[8px] tracking-[0.1em] text-zinc-600 uppercase">
                      {transcript.language ?? "Unknown language"}
                      {transcript.provider ? ` · ${transcript.provider}` : ""}
                      {" · "}
                      {transcript.text.length.toLocaleString("en-US")} characters
                    </p>
                  </div>
                  <span className="font-mono text-[8px] tracking-[0.12em] text-zinc-500 uppercase group-open:hidden">
                    Open
                  </span>
                  <span className="hidden font-mono text-[8px] tracking-[0.12em] text-zinc-500 uppercase group-open:inline">
                    Close
                  </span>
                </summary>
                <div className="max-h-[28rem] overflow-y-auto border-t border-white/[0.06] px-4 py-4 sm:px-5">
                  <p className="text-[12.5px] leading-[1.8] whitespace-pre-wrap text-zinc-400">
                    {transcript.text}
                  </p>
                </div>
              </details>
            </section>
          ) : null}
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0a0b]">
            <div className="border-b border-white/[0.06] px-4 py-3.5">
              <p className="font-mono text-[8px] tracking-[0.18em] text-zinc-500 uppercase">Record</p>
              <h2 className="mt-1 text-[12.5px] font-medium text-zinc-200">Source & credits</h2>
            </div>
            <dl className="space-y-2.5 px-4 py-4">
              <DetailRow label="Source" value={sourceLabel} />
              <DetailRow
                label="Duration"
                value={duration === null ? "Pending" : formatTimecode(duration)}
              />
              <DetailRow
                label="Size"
                value={project.size_bytes ? formatBytes(project.size_bytes) : "—"}
              />
              <DetailRow label={creditLabel} value={creditValue} />
              <DetailRow label="Max source" value={`${MAX_SOURCE_DURATION_MINUTES} min · 500 MB`} />
              <DetailRow label="Created" value={formatDateTime(project.created_at)} />
              <DetailRow label="Updated" value={formatDateTime(project.updated_at)} />
            </dl>
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0a0b]">
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3.5">
              <div>
                <p className="font-mono text-[8px] tracking-[0.18em] text-zinc-500 uppercase">
                  Ledger
                </p>
                <h2 className="mt-1 text-[12.5px] font-medium text-zinc-200">Job attempts</h2>
              </div>
              <span className="font-mono text-[9px] text-zinc-600">{jobs.length}</span>
            </div>
            {jobs.length > 0 ? (
              <ol className="divide-y divide-white/[0.05]">
                {jobs.map((job) => (
                  <li key={job.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] text-zinc-300">
                        {JOB_TYPE_LABELS[job.job_type]}
                      </p>
                      <p className="mt-0.5 font-mono text-[8px] tracking-[0.08em] text-zinc-600 uppercase">
                        {formatDateTime(job.updated_at)} · {job.attempts}{" "}
                        {job.attempts === 1 ? "try" : "tries"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 font-mono text-[8px] tracking-[0.1em] uppercase",
                        JOB_TONE[job.status],
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "size-1 rounded-full bg-current",
                          job.status === "in_progress" && "animate-pulse",
                        )}
                      />
                      {JOB_LABEL[job.status]}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-4 py-4 text-[11px] leading-relaxed text-zinc-600">
                No worker jobs yet. The first job is created when the source is verified.
              </p>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0a0b]">
            <div className="border-b border-white/[0.06] px-4 py-3.5">
              <p className="font-mono text-[8px] tracking-[0.18em] text-zinc-500 uppercase">
                Output
              </p>
              <h2 className="mt-1 text-[12.5px] font-medium text-zinc-200">Export spec</h2>
            </div>
            <div className="space-y-2.5 px-4 py-4 text-[11px] text-zinc-400">
              <p className="flex items-center gap-2">
                <CaptionsIcon className="size-3.5 shrink-0 text-signal/80" />
                Word-level caption highlight
              </p>
              <p className="flex items-center gap-2">
                <FilmIcon className="size-3.5 shrink-0 text-signal/80" />
                1080 × 1920 · H.264/AAC
              </p>
              <p className="flex items-center gap-2">
                <WalletIcon className="size-3.5 shrink-0 text-signal/80" />
                Center crop to 9:16 · no face tracking
              </p>
              <p className="flex items-start gap-2 border-t border-white/[0.05] pt-2.5 text-[10px] leading-relaxed text-zinc-600">
                <ShieldCheckIcon className="mt-0.5 size-3.5 shrink-0" />
                Signed previews expire after 60 minutes. Reload for fresh links.
              </p>
            </div>
          </section>
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
        "mt-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[11.5px] leading-relaxed",
        tone === "danger"
          ? "border-destructive/25 bg-destructive/[0.07] text-red-200"
          : "border-amber-300/20 bg-amber-300/[0.04] text-amber-100/90",
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
      <dt className="font-mono text-[8px] tracking-[0.12em] text-zinc-600 uppercase">{label}</dt>
      <dd className="max-w-[62%] truncate text-right text-[11px] text-zinc-300">{value}</dd>
    </div>
  );
}
