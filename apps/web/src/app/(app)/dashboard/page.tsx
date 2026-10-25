import {
  MAX_SOURCE_DURATION_MINUTES,
  PLAN_CATALOG,
  formatPlanPrice,
  getPlan,
  isSupportedSourceUrl,
  type PlanTier,
  type ProjectStatus,
} from "@clipmax/shared";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  Clock3Icon,
  FilmIcon,
  FolderOpenIcon,
  PlayIcon,
  PlusIcon,
  SparklesIcon,
  WalletIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { ProjectCard, type ProjectCardData } from "@/components/studio/project-card";
import { ProjectPoller } from "@/components/studio/project-poller";
import { StudioConfigurationState } from "@/components/studio/configuration-state";
import { UploadPanel } from "@/components/studio/upload-panel";
import { formatTimecode } from "@/lib/format";
import { dashboardNextPath } from "@/lib/navigation";
import { isR2Configured, presignGet } from "@/lib/r2";
import { getCurrentUser } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

type ProjectRow = {
  id: string;
  title: string;
  status: ProjectStatus;
  duration_seconds: number | null;
  credits_reserved: number;
  error_message: string | null;
  created_at: string;
};

type ClipThumbRow = {
  project_id: string;
  thumbnail_path: string | null;
};

type ReadyClipRow = {
  id: string;
  project_id: string;
  title: string;
  thumbnail_path: string | null;
  start_time: number | string;
  end_time: number | string;
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

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function firstName(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.split("@")[0] || "there";
  return source.split(/[.\s_-]/)[0]?.replace(/^\w/, (letter) => letter.toUpperCase()) || "there";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rawSource = first(params.source);
  const initialLink = rawSource && isSupportedSourceUrl(rawSource) ? rawSource : "";
  const uploadIntent = first(params.intent) === "upload";
  const nextPath = dashboardNextPath({
    source: initialLink || null,
    intent: uploadIntent ? "upload" : null,
  });

  const { supabase, user } = await getCurrentUser();

  if (!supabase) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-[9px] tracking-[0.2em] text-signal uppercase">
          Studio / not connected
        </p>
        <h1 className="mt-3 max-w-3xl text-[clamp(2rem,4.2vw,3.4rem)] leading-[0.98] font-semibold tracking-[-0.055em] text-balance">
          Your studio is{" "}
          <span className="font-serif text-[1.04em] font-normal tracking-[-0.03em] text-signal italic">
            not connected.
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-zinc-400">
          This is the real studio shell, not a mock. Add the Supabase and R2 credentials to make
          auth, uploads, credits, and processing live.
        </p>
        <div className="mt-8">
          <StudioConfigurationState keys={REQUIRED_STUDIO_KEYS} />
        </div>
        <div className="mt-6">
          <UploadPanel configured={false} />
        </div>
      </div>
    );
  }

  if (!user) redirect(`/signup?next=${encodeURIComponent(nextPath)}`);

  const [
    { data: wallet, error: walletError },
    { data: profile, error: profileError },
    { data: projectRows, error: projectsError },
    { count: projectCount },
    { count: renderedClipCount },
    { count: activeCount },
    { count: completedCount },
    { data: readyClips, error: readyClipsError },
  ] = await Promise.all([
    supabase.from("credit_wallets").select("balance").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("profiles")
      .select("plan, display_name")
      .eq("id", user.id)
      .maybeSingle<{ plan: string; display_name: string | null }>(),
    supabase
      .from("projects")
      .select("id, title, status, duration_seconds, credits_reserved, error_message, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<ProjectRow[]>(),
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("clips")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("render_status", "rendered"),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["ready", "processing", "uploading"]),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed"),
    supabase
      .from("clips")
      .select("id, project_id, title, thumbnail_path, start_time, end_time")
      .eq("user_id", user.id)
      .eq("render_status", "rendered")
      .order("created_at", { ascending: false })
      .limit(3)
      .returns<ReadyClipRow[]>(),
  ]);

  const projects = projectRows ?? [];
  const projectIds = projects.map((project) => project.id);
  const thumbByProject = new Map<string, string | null>();
  const clipCountByProject = new Map<string, number>();

  if (projectIds.length > 0) {
    const { data: clipThumbs } = await supabase
      .from("clips")
      .select("project_id, thumbnail_path")
      .in("project_id", projectIds)
      .eq("render_status", "rendered")
      .returns<ClipThumbRow[]>();

    for (const clip of clipThumbs ?? []) {
      clipCountByProject.set(clip.project_id, (clipCountByProject.get(clip.project_id) ?? 0) + 1);
    }

    if (isR2Configured()) {
      await Promise.all(
        (clipThumbs ?? []).map(async (clip) => {
          if (!clip.thumbnail_path || thumbByProject.has(clip.project_id)) return;
          try {
            thumbByProject.set(clip.project_id, await presignGet(clip.thumbnail_path));
          } catch {
            thumbByProject.set(clip.project_id, null);
          }
        }),
      );
    }
  }

  const readyClipViews = await Promise.all(
    (readyClips ?? []).map(async (clip) => {
      let thumbnailUrl: string | null = null;
      if (clip.thumbnail_path && isR2Configured()) {
        try {
          thumbnailUrl = await presignGet(clip.thumbnail_path);
        } catch {
          thumbnailUrl = null;
        }
      }
      return { ...clip, thumbnailUrl };
    }),
  );

  const credits = typeof wallet?.balance === "number" ? wallet.balance : null;
  const planTier = (profile?.plan ?? "free") as PlanTier;
  const plan = getPlan(planTier) ?? PLAN_CATALOG.free;
  const displayName = firstName(profile?.display_name ?? null, user.email ?? null);
  const totalProjects = projectCount ?? projects.length;
  const clipsReady = renderedClipCount ?? 0;
  const inPipeline = activeCount ?? 0;
  const completed = completedCount ?? 0;
  const polling = projects.some(
    (project) => project.status === "ready" || project.status === "processing",
  );
  const loadError = walletError ?? profileError ?? projectsError ?? readyClipsError ?? null;
  const hasServerKeys = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    (process.env.R2_ACCOUNT_ID || process.env.R2_ENDPOINT) &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET,
  );
  const allowance = plan.creditsPerMonth;
  const meter =
    credits === null ? 0 : Math.min(100, Math.max(0, Math.round((credits / allowance) * 100)));

  const checklist = [
    {
      label: "Account connected",
      detail: "Supabase session and RLS are live.",
      done: true,
    },
    {
      label: "Add a source",
      detail: "Upload a file or queue a public link.",
      done: totalProjects > 0,
    },
    {
      label: "Review your first clips",
      detail: "Open a project when the render completes.",
      done: clipsReady > 0,
    },
  ];
  const completedSteps = checklist.filter((item) => item.done).length;

  const projectCards: ProjectCardData[] = projects.map((project) => ({
    id: project.id,
    title: project.title,
    status: project.status,
    durationSeconds: project.duration_seconds,
    creditsReserved: project.credits_reserved,
    errorMessage: project.error_message,
    createdAt: project.created_at,
    clipCount: clipCountByProject.get(project.id) ?? 0,
    thumbnailUrl: thumbByProject.get(project.id) ?? null,
  }));

  return (
    <div className="mx-auto max-w-[1320px]">
      <ProjectPoller active={polling} />

      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="font-mono text-[9px] tracking-[0.2em] text-signal uppercase">
              Studio / overview
            </p>
            <span className="h-3 w-px bg-white/10" />
            <p className="font-mono text-[9px] tracking-[0.14em] text-zinc-600 uppercase">
              {new Intl.DateTimeFormat("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              }).format(new Date())}
            </p>
          </div>
          <h1 className="mt-3 text-[clamp(2rem,3.6vw,3.15rem)] leading-[0.98] font-semibold tracking-[-0.055em] text-balance">
            Welcome back, {displayName}.{" "}
            <span className="font-serif text-[1.03em] font-normal tracking-[-0.03em] text-zinc-500 italic">
              {inPipeline > 0 ? "The queue is moving." : "The desk is clear."}
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-zinc-400">
            {inPipeline > 0
              ? `${inPipeline} ${inPipeline === 1 ? "source is" : "sources are"} moving through the real pipeline. This page refreshes while the worker is busy.`
              : totalProjects > 0
                ? "Your sources, credits, and renders in one place. No sample rows are mixed into this workspace."
                : "Bring one long recording. ClipMax finds the moments, crops to 9:16, and burns the captions."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/billing"
            className="group flex h-10 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 transition-colors hover:border-white/[0.15] hover:bg-white/[0.04]"
          >
            <WalletIcon className="size-3.5 text-signal" />
            <span className="font-mono text-[11px] text-zinc-200">
              {credits === null ? "—" : credits}
            </span>
            <span className="font-mono text-[8px] tracking-[0.12em] text-zinc-600 uppercase">
              credits
            </span>
            <ArrowUpRightIcon className="size-3 text-zinc-600 transition-colors group-hover:text-zinc-300" />
          </Link>
          <Link
            href="#new-project"
            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[12.5px] font-semibold text-primary-foreground shadow-[0_12px_35px_-16px_rgba(21,94,239,0.95)] transition-[filter,transform] hover:brightness-110 active:scale-[0.99]"
          >
            <PlusIcon className="size-4" />
            New project
          </Link>
        </div>
      </div>

      {loadError ? (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/[0.07] px-3.5 py-3 text-[11.5px] leading-relaxed text-red-200"
        >
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
          <span>Some studio data could not be loaded: {loadError.message}</span>
        </div>
      ) : null}

      {!hasServerKeys ? (
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-amber-300/20 bg-amber-300/[0.04] px-3.5 py-3 text-[11.5px] leading-relaxed text-amber-100/90">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            Auth is connected, but the service-role or R2 credentials are missing. Uploads return a
            configuration error until those are set.
          </span>
        </div>
      ) : null}

      <dl className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
        <StatCell
          icon={<WalletIcon className="size-3.5" />}
          label="Credits"
          value={credits === null ? "—" : credits}
          detail={`${meter}% of ${allowance}/mo`}
          meter={meter}
        />
        <StatCell
          icon={<Clock3Icon className="size-3.5" />}
          label="In pipeline"
          value={inPipeline}
          detail={inPipeline === 1 ? "source moving" : "sources moving"}
        />
        <StatCell
          icon={<FilmIcon className="size-3.5" />}
          label="Clips ready"
          value={clipsReady}
          detail="rendered & captioned"
        />
        <StatCell
          icon={<FolderOpenIcon className="size-3.5" />}
          label="Projects"
          value={totalProjects}
          detail={`${completed} completed`}
        />
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)] lg:items-start">
        <UploadPanel
          configured={hasServerKeys}
          initialLink={initialLink}
          initialMode={initialLink ? "link" : "upload"}
          uploadIntent={uploadIntent}
        />

        <div className="space-y-4">
          {readyClipViews.length > 0 ? (
            <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.035] to-white/[0.01]">
              <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
                <div>
                  <p className="font-mono text-[8px] tracking-[0.2em] text-signal uppercase">
                    Ready to post
                  </p>
                  <h2 className="mt-1 text-[15px] font-semibold tracking-[-0.02em]">
                    Your latest renders
                  </h2>
                </div>
                <Link
                  href="/dashboard/projects"
                  className="font-mono text-[8px] tracking-[0.12em] text-zinc-500 uppercase transition-colors hover:text-signal"
                >
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2 p-3">
                {readyClipViews.map((clip) => (
                  <Link
                    key={clip.id}
                    href={`/dashboard/projects/${clip.project_id}`}
                    className="group relative aspect-[9/14] overflow-hidden rounded-lg border border-white/[0.08] bg-[#0c0d0f]"
                  >
                    {clip.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- signed R2 URL
                      <img
                        src={clip.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(21,94,239,0.35),transparent_65%)]" />
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                    <span className="absolute right-1.5 bottom-1.5 left-1.5">
                      <span className="line-clamp-2 text-[9px] leading-snug font-medium text-white/90">
                        {clip.title}
                      </span>
                      <span className="mt-1 block font-mono text-[7px] tracking-[0.1em] text-white/45 uppercase">
                        {formatTimecode(
                          (typeof clip.end_time === "number"
                            ? clip.end_time
                            : Number(clip.end_time)) -
                            (typeof clip.start_time === "number"
                              ? clip.start_time
                              : Number(clip.start_time)),
                        )}
                      </span>
                    </span>
                    <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full border border-white/20 bg-black/45 backdrop-blur-sm">
                      <PlayIcon className="size-2.5 fill-white/90 text-white/90" />
                    </span>
                  </Link>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3">
                <p className="text-[10.5px] leading-relaxed text-zinc-500">
                  {clipsReady} {clipsReady === 1 ? "clip is" : "clips are"} rendered and ready to
                  download.
                </p>
                <Link
                  href="/dashboard/projects"
                  className="inline-flex items-center gap-1 font-mono text-[8px] tracking-[0.12em] text-signal uppercase"
                >
                  Open library
                  <ArrowRightIcon className="size-3" />
                </Link>
              </div>
            </section>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.035] to-white/[0.01]">
              <div className="border-b border-white/[0.06] px-5 py-4">
                <p className="font-mono text-[8px] tracking-[0.2em] text-signal uppercase">
                  Getting started
                </p>
                <h2 className="mt-1 text-[15px] font-semibold tracking-[-0.02em]">
                  Three moves to your first post.
                </h2>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-signal/80 transition-[width] duration-700"
                      style={{ width: `${(completedSteps / checklist.length) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[8px] tracking-[0.1em] text-zinc-500 uppercase">
                    {completedSteps}/{checklist.length}
                  </span>
                </div>

                <ol className="mt-5 space-y-3.5">
                  {checklist.map((item, index) => {
                    const active =
                      !item.done && checklist.slice(0, index).every((step) => step.done);
                    return (
                      <li key={item.label} className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[8px]",
                            item.done
                              ? "border-signal/35 bg-signal/[0.08] text-signal"
                              : active
                                ? "border-signal/40 bg-signal/[0.06] text-signal"
                                : "border-white/[0.09] bg-white/[0.02] text-zinc-600",
                          )}
                        >
                          {item.done ? (
                            <CheckIcon className="size-3" />
                          ) : (
                            String(index + 1).padStart(2, "0")
                          )}
                        </span>
                        <span className="min-w-0">
                          <span
                            className={cn(
                              "block text-[12.5px] font-medium",
                              item.done ? "text-zinc-400" : "text-zinc-200",
                            )}
                          >
                            {item.label}
                          </span>
                          <span className="mt-0.5 block text-[10.5px] leading-relaxed text-zinc-600">
                            {item.detail}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>

                {totalProjects === 0 ? (
                  <Link
                    href="#new-project"
                    className="mt-5 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-signal/20 bg-signal/[0.05] text-[11.5px] font-medium text-signal transition-colors hover:bg-signal/[0.08]"
                  >
                    <PlusIcon className="size-3.5" />
                    Add your first source
                  </Link>
                ) : null}
              </div>
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.018]">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <SparklesIcon className="size-3.5 text-signal" />
                <h2 className="text-[12px] font-medium text-zinc-300">The meter, in the open</h2>
              </div>
              <span className="font-mono text-[8px] tracking-[0.12em] text-zinc-600 uppercase">
                {plan.name} · {formatPlanPrice(plan.price, "USD")}/mo
              </span>
            </div>
            <div className="space-y-2.5 px-5 py-4 text-[10.5px] leading-relaxed text-zinc-500">
              <p className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 size-3 shrink-0 text-signal/70" />
                One credit is one minute of source video, rounded up.
              </p>
              <p className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 size-3 shrink-0 text-signal/70" />
                Up to 15 credits are held until ffprobe confirms the duration.
              </p>
              <p className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 size-3 shrink-0 text-signal/70" />A permanent failure
                refunds the hold automatically.
              </p>
              <Link
                href="/dashboard/billing"
                className="mt-1 inline-flex items-center gap-1 font-mono text-[8px] tracking-[0.12em] text-signal uppercase"
              >
                Open billing
                <ArrowRightIcon className="size-3" />
              </Link>
            </div>
          </section>
        </div>
      </div>

      <section aria-labelledby="recent-projects" className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[8px] tracking-[0.2em] text-signal uppercase">
              The library
            </p>
            <h2 id="recent-projects" className="mt-1 text-[19px] font-semibold tracking-[-0.035em]">
              Recent projects
            </h2>
          </div>
          <Link
            href="/dashboard/projects"
            className="group inline-flex items-center gap-1.5 font-mono text-[8.5px] tracking-[0.14em] text-zinc-500 uppercase transition-colors hover:text-signal"
          >
            All {totalProjects} projects
            <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.09] bg-white/[0.012] px-6 py-14 text-center">
            <div className="grid size-12 place-items-center rounded-full border border-signal/20 bg-signal/[0.06]">
              <SparklesIcon className="size-5 text-signal" />
            </div>
            <p className="mt-4 text-[13px] font-medium text-zinc-200">No projects yet.</p>
            <p className="mt-1 max-w-xs text-[11.5px] leading-relaxed text-zinc-500">
              Upload a source or paste a public link. Your first project will show its real status
              here.
            </p>
            <Link
              href="#new-project"
              className="mt-5 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-signal"
            >
              Start with a source
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {projectCards.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      <p className="mt-8 max-w-3xl text-[10.5px] leading-relaxed text-zinc-600">
        Sources are limited to {MAX_SOURCE_DURATION_MINUTES} minutes. Credits are charged per
        started minute; the worker settles the exact amount after ffprobe. A failed job refunds the
        hold. No clip counts on this page are estimated.
      </p>
    </div>
  );
}

function StatCell({
  icon,
  label,
  value,
  detail,
  meter,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  detail: string;
  meter?: number;
}) {
  return (
    <div className="group relative bg-[#0a0a0b] px-4 py-4 transition-colors hover:bg-[#0c0d0f] sm:px-5 sm:py-5">
      <dt className="flex items-center gap-2 font-mono text-[8px] tracking-[0.18em] text-zinc-500 uppercase">
        <span className="text-signal/80">{icon}</span>
        {label}
      </dt>
      <dd className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-[1.85rem] leading-none tracking-[-0.05em] text-zinc-100 tabular">
          {value}
        </span>
      </dd>
      <p className="mt-2 font-mono text-[8px] tracking-[0.1em] text-zinc-600 uppercase">{detail}</p>
      {typeof meter === "number" ? (
        <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-white/[0.05]">
          <div
            className="h-full rounded-full bg-signal/70 transition-[width] duration-700"
            style={{ width: `${meter}%` }}
          />
        </div>
      ) : null}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      />
    </div>
  );
}
