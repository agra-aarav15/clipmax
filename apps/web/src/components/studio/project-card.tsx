import type { ProjectStatus } from "@clipmax/shared";
import { ChevronRightIcon, FilmIcon } from "lucide-react";
import Link from "next/link";

import { ProjectStatusBadge } from "@/components/studio/status-badge";
import { formatDate, formatTimecode } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ProjectCardData = {
  id: string;
  title: string;
  status: ProjectStatus;
  durationSeconds: number | null;
  creditsReserved: number;
  errorMessage: string | null;
  createdAt: string;
  clipCount: number;
  thumbnailUrl: string | null;
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="group relative flex min-w-0 gap-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.018] p-3.5 transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-white/[0.035] focus-visible:ring-2 focus-visible:ring-signal/70 focus-visible:outline-hidden sm:p-4"
    >
      <div className="relative h-[94px] w-[60px] shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0c0d0f]">
        {project.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived R2 URL
          <img
            src={project.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(21,94,239,0.28),transparent_65%)]"
            />
            <div className="absolute inset-x-2 top-2 h-px bg-white/10" />
            <FilmIcon className="relative size-4 text-white/25" />
            <span className="absolute bottom-1.5 font-mono text-[6px] tracking-[0.16em] text-white/20 uppercase">
              9:16
            </span>
          </div>
        )}
        {project.status === "processing" || project.status === "ready" ? (
          <span className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-black/40">
            <span className="block h-full w-1/2 animate-marquee bg-signal/80" />
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[13.5px] leading-snug font-medium tracking-[-0.01em] text-zinc-100">
            {project.title}
          </h3>
          <ChevronRightIcon className="mt-0.5 size-3.5 shrink-0 text-zinc-600 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-zinc-300" />
        </div>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[8.5px] tracking-[0.08em] text-zinc-500 uppercase">
          <span>{formatDate(project.createdAt)}</span>
          <span aria-hidden="true" className="text-zinc-700">
            /
          </span>
          <span>{formatTimecode(project.durationSeconds)}</span>
          <span aria-hidden="true" className="text-zinc-700">
            /
          </span>
          <span>
            {project.clipCount} {project.clipCount === 1 ? "clip" : "clips"}
          </span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <ProjectStatusBadge status={project.status} />
          <span
            className={cn(
              "font-mono text-[8px] tracking-[0.1em] uppercase",
              project.creditsReserved > 0 ? "text-zinc-500" : "text-zinc-700",
            )}
          >
            {project.creditsReserved > 0
              ? `${project.creditsReserved} cr held`
              : "No hold"}
          </span>
        </div>

        {project.status === "failed" && project.errorMessage ? (
          <p className="mt-2 line-clamp-2 rounded-md border border-destructive/15 bg-destructive/[0.06] px-2 py-1 text-[10px] leading-relaxed text-red-200/90">
            {project.errorMessage}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
