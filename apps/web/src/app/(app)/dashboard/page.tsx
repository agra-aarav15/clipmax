import {
  MAX_SOURCE_DURATION_MINUTES,
  PLAN_CATALOG,
  formatPlanPrice,
  getPlan,
  type PlanTier,
  type ProjectStatus,
} from "@clipmax/shared";
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  FolderOpenIcon,
  SparklesIcon,
  WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StudioConfigurationState } from "@/components/studio/configuration-state";
import { ProjectPoller } from "@/components/studio/project-poller";
import { ProjectStatusBadge } from "@/components/studio/status-badge";
import { UploadPanel } from "@/components/studio/upload-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatTimecode } from "@/lib/format";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProjectRow = {
  id: string;
  title: string;
  status: ProjectStatus;
  duration_seconds: number | null;
  credits_reserved: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
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

export default async function DashboardPage() {
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
            This is the real studio shell, not a mock. Add the Supabase and R2 credentials to make
            auth, uploads, credits, and processing live.
          </p>
        </div>
        <StudioConfigurationState keys={REQUIRED_STUDIO_KEYS} />
        <UploadPanel configured={false} />
      </div>
    );
  }

  if (!user) redirect("/signup?next=/dashboard");

  const [
    { data: wallet, error: walletError },
    { data: profile, error: profileError },
    { data: projectRows, error: projectsError },
  ] = await Promise.all([
    supabase.from("credit_wallets").select("balance").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle<{ plan: string }>(),
    supabase
      .from("projects")
      .select(
        "id, title, status, duration_seconds, credits_reserved, error_message, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(24)
      .returns<ProjectRow[]>(),
  ]);

  const projects = projectRows ?? [];
  const projectIds = projects.map((project) => project.id);
  const renderedClipCounts = new Map<string, number>();

  if (projectIds.length > 0) {
    const { data: renderedClips } = await supabase
      .from("clips")
      .select("project_id")
      .in("project_id", projectIds)
      .eq("render_status", "rendered")
      .returns<{ project_id: string }[]>();

    for (const clip of renderedClips ?? []) {
      renderedClipCounts.set(clip.project_id, (renderedClipCounts.get(clip.project_id) ?? 0) + 1);
    }
  }

  const polling = projects.some(
    (project) => project.status === "ready" || project.status === "processing",
  );
  const credits = typeof wallet?.balance === "number" ? wallet.balance : null;
  const processing = projects.filter(
    (project) => project.status === "processing" || project.status === "ready",
  ).length;
  const completed = projects.filter((project) => project.status === "completed").length;
  const plan = getPlan((profile?.plan ?? "free") as PlanTier) ?? PLAN_CATALOG.free;
  const hasServerKeys = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    (process.env.R2_ACCOUNT_ID || process.env.R2_ENDPOINT) &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET,
  );

  return (
    <div className="mx-auto max-w-6xl">
      <ProjectPoller active={polling} />

      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="font-mono text-[0.625rem] tracking-[0.2em] text-signal uppercase">Studio</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Long video in. A week of clips out.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Your sources, credits, and renders in one place. The queue is real; no sample rows are
            mixed into this workspace.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">Plan</p>
          <p className="mt-1 text-sm font-medium">
            {plan.name}{" "}
            <span className="font-normal text-muted-foreground">
              · {formatPlanPrice(plan.price, "USD")} / mo
            </span>
          </p>
        </div>
      </div>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-background px-4 py-4">
          <dt className="flex items-center gap-2 text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">
            <WalletIcon className="size-3.5 text-signal" />
            Credits
          </dt>
          <dd className="mt-1 font-mono text-2xl">{credits === null ? "—" : credits}</dd>
        </div>
        <div className="bg-background px-4 py-4">
          <dt className="text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">
            Projects
          </dt>
          <dd className="mt-1 font-mono text-2xl">{projects.length}</dd>
        </div>
        <div className="bg-background px-4 py-4">
          <dt className="text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">
            In queue
          </dt>
          <dd className="mt-1 font-mono text-2xl">{processing}</dd>
        </div>
        <div className="bg-background px-4 py-4">
          <dt className="text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">
            Completed
          </dt>
          <dd className="mt-1 font-mono text-2xl">{completed}</dd>
        </div>
      </dl>

      {walletError || profileError ? (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            Could not load the account details: {walletError?.message ?? profileError?.message}
          </span>
        </div>
      ) : null}

      {!hasServerKeys ? (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-amber-300/20 bg-amber-300/[0.04] px-3 py-2.5 text-xs leading-relaxed text-amber-200">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            Auth is connected, but the service-role or R2 credentials are missing. Uploads will
            return a configuration error until those are set.
          </span>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <UploadPanel configured={hasServerKeys} />

        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b border-border/70 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Recent projects</CardTitle>
                <CardDescription className="mt-1">
                  Newest first. Only your rows are visible through RLS.
                </CardDescription>
              </div>
              <FolderOpenIcon className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>

          {projectsError ? (
            <CardContent className="py-6">
              <p className="text-sm text-destructive">
                Could not load projects: {projectsError.message}
              </p>
            </CardContent>
          ) : projects.length === 0 ? (
            <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="grid size-12 place-items-center rounded-full border border-signal/20 bg-signal/[0.06]">
                <SparklesIcon className="size-5 text-signal" />
              </div>
              <p className="mt-4 text-sm font-medium">No projects yet.</p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                Upload a source or paste a public link. Your first project will show its real status
                here.
              </p>
            </CardContent>
          ) : (
            <ul className="divide-y divide-border/70">
              {projects.map((project) => {
                const clipCount = renderedClipCounts.get(project.id) ?? 0;
                return (
                  <li key={project.id}>
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="group block px-5 py-4 transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex items-center gap-1 truncate text-sm font-medium">
                            {project.title}
                            <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.625rem] text-muted-foreground">
                            <span>{formatDate(project.created_at)}</span>
                            <span aria-hidden="true">·</span>
                            <span>{formatTimecode(project.duration_seconds)}</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {clipCount} {clipCount === 1 ? "clip" : "clips"}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{project.credits_reserved} credits held</span>
                          </p>
                        </div>
                        <ProjectStatusBadge status={project.status} />
                      </div>
                      {project.status === "failed" && project.error_message ? (
                        <p className="mt-2 rounded-md border border-destructive/20 bg-destructive/10 px-2.5 py-1.5 text-[0.6875rem] leading-relaxed text-destructive">
                          {project.error_message}
                        </p>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
        Sources are limited to {MAX_SOURCE_DURATION_MINUTES} minutes. Credits are charged per
        started minute; the worker settles the exact amount after ffprobe. A failed job refunds the
        hold.
      </p>
    </div>
  );
}
