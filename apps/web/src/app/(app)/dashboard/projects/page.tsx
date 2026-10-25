import type { ProjectStatus } from "@clipmax/shared";
import { AlertTriangleIcon, FolderOpenIcon, PlusIcon, SearchIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ProjectCard, type ProjectCardData } from "@/components/studio/project-card";
import { StudioConfigurationState } from "@/components/studio/configuration-state";
import { isR2Configured, presignGet } from "@/lib/r2";
import { getCurrentUser } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
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

type ClipRow = {
  project_id: string;
  thumbnail_path: string | null;
};

type SearchParams = Record<string, string | string[] | undefined>;

const FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "In pipeline" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
] as const;

function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const statusFilter = FILTERS.some((item) => item.value === first(params.status))
    ? (first(params.status) as (typeof FILTERS)[number]["value"])
    : "all";
  const query = (first(params.q) ?? "").trim().slice(0, 80);

  const { supabase, user } = await getCurrentUser();

  if (!supabase) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-[9px] tracking-[0.2em] text-signal uppercase">
          Studio / projects
        </p>
        <h1 className="mt-3 text-[clamp(2rem,4vw,3rem)] leading-none font-semibold tracking-[-0.055em]">
          The library is not connected.
        </h1>
        <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-zinc-400">
          Project rows are real database rows. Add the Supabase credentials to load them.
        </p>
        <div className="mt-8">
          <StudioConfigurationState
            keys={["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]}
          />
        </div>
      </div>
    );
  }

  if (!user) redirect("/signup?next=%2Fdashboard%2Fprojects");

  let request = supabase
    .from("projects")
    .select("id, title, status, duration_seconds, credits_reserved, error_message, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);

  if (statusFilter === "active") request = request.in("status", ["ready", "processing", "uploading"]);
  if (statusFilter === "completed") request = request.eq("status", "completed");
  if (statusFilter === "failed") request = request.eq("status", "failed");
  if (query) request = request.ilike("title", `%${query}%`);

  const { data: projectRows, error } = await request.returns<ProjectRow[]>();
  const projects = projectRows ?? [];
  const projectIds = projects.map((project) => project.id);
  const clipCounts = new Map<string, number>();
  const thumbs = new Map<string, string | null>();

  if (projectIds.length > 0) {
    const { data: clips } = await supabase
      .from("clips")
      .select("project_id, thumbnail_path")
      .in("project_id", projectIds)
      .eq("render_status", "rendered")
      .returns<ClipRow[]>();

    for (const clip of clips ?? []) {
      clipCounts.set(clip.project_id, (clipCounts.get(clip.project_id) ?? 0) + 1);
    }

    if (isR2Configured()) {
      await Promise.all(
        (clips ?? []).map(async (clip) => {
          if (!clip.thumbnail_path || thumbs.has(clip.project_id)) return;
          try {
            thumbs.set(clip.project_id, await presignGet(clip.thumbnail_path));
          } catch {
            thumbs.set(clip.project_id, null);
          }
        }),
      );
    }
  }

  const cards: ProjectCardData[] = projects.map((project) => ({
    id: project.id,
    title: project.title,
    status: project.status,
    durationSeconds: project.duration_seconds,
    creditsReserved: project.credits_reserved,
    errorMessage: project.error_message,
    createdAt: project.created_at,
    clipCount: clipCounts.get(project.id) ?? 0,
    thumbnailUrl: thumbs.get(project.id) ?? null,
  }));

  return (
    <div className="mx-auto max-w-[1320px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] tracking-[0.2em] text-signal uppercase">
            Studio / projects
          </p>
          <h1 className="mt-2 text-[clamp(2rem,3.5vw,2.85rem)] leading-none font-semibold tracking-[-0.055em]">
            Every source,{" "}
            <span className="font-serif text-[1.04em] font-normal tracking-[-0.03em] text-zinc-500 italic">
              in one room.
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-zinc-400">
            {projects.length === 0
              ? "No projects match this view yet. Add a source or clear the filter."
              : `${projects.length} ${projects.length === 1 ? "project" : "projects"} in this view. Statuses and clip counts come straight from the database.`}
          </p>
        </div>
        <Link
          href="/dashboard#new-project"
          className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[12.5px] font-semibold text-primary-foreground shadow-[0_12px_35px_-16px_rgba(21,94,239,0.95)] transition-[filter,transform] hover:brightness-110 active:scale-[0.99]"
        >
          <PlusIcon className="size-4" />
          New project
        </Link>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav
          aria-label="Filter projects by status"
          className="flex flex-wrap items-center gap-1 rounded-xl border border-white/[0.07] bg-black/20 p-1"
        >
          {FILTERS.map((filter) => {
            const active = filter.value === statusFilter;
            const href =
              filter.value === "all"
                ? query
                  ? `/dashboard/projects?q=${encodeURIComponent(query)}`
                  : "/dashboard/projects"
                : `/dashboard/projects?status=${filter.value}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
            return (
              <Link
                key={filter.value}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-8 items-center rounded-lg px-3 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                {filter.label}
              </Link>
            );
          })}
        </nav>

        <form action="/dashboard/projects" className="relative w-full sm:w-64">
          {statusFilter !== "all" ? (
            <input type="hidden" name="status" value={statusFilter} />
          ) : null}
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-600" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search project titles"
            aria-label="Search project titles"
            className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] pr-3 pl-9 text-[12px] text-zinc-200 placeholder:text-zinc-600 focus-visible:border-signal/40 focus-visible:ring-2 focus-visible:ring-signal/30 focus-visible:outline-hidden"
          />
        </form>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/[0.07] px-3.5 py-3 text-[11.5px] text-red-200"
        >
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
          Could not load projects: {error.message}
        </div>
      ) : null}

      {cards.length > 0 ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.09] bg-white/[0.012] px-6 py-16 text-center">
          <div className="grid size-12 place-items-center rounded-full border border-signal/20 bg-signal/[0.06]">
            <FolderOpenIcon className="size-5 text-signal" />
          </div>
          <p className="mt-4 text-[13px] font-medium text-zinc-200">
            {query || statusFilter !== "all" ? "Nothing matches this view." : "No projects yet."}
          </p>
          <p className="mt-1 max-w-sm text-[11.5px] leading-relaxed text-zinc-500">
            {query || statusFilter !== "all"
              ? "Clear the search or switch the status filter. No rows are invented to fill the gap."
              : "Bring a long recording and the pipeline will fill this library with real clips."}
          </p>
          <div className="mt-5 flex items-center gap-2">
            {query || statusFilter !== "all" ? (
              <Link
                href="/dashboard/projects"
                className="inline-flex h-9 items-center rounded-lg border border-white/[0.1] px-3.5 text-[11.5px] text-zinc-300 transition-colors hover:bg-white/[0.04]"
              >
                Clear filters
              </Link>
            ) : null}
            <Link
              href="/dashboard#new-project"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[11.5px] font-semibold text-primary-foreground"
            >
              <PlusIcon className="size-3.5" />
              New project
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
