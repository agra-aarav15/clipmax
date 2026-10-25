import type { ProjectStatus } from "@clipmax/shared";

import { cn } from "@/lib/utils";

const LABELS: Record<ProjectStatus, string> = {
  uploading: "Uploading",
  ready: "Queued",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

const TONES: Record<ProjectStatus, string> = {
  uploading: "border-zinc-500/25 bg-zinc-500/10 text-zinc-300",
  ready: "border-sky-300/25 bg-sky-300/[0.07] text-sky-200",
  processing: "border-signal/30 bg-signal/[0.08] text-signal",
  completed: "border-signal/25 bg-signal/[0.06] text-signal",
  failed: "border-destructive/30 bg-destructive/10 text-red-200",
};

const DOTS: Record<ProjectStatus, string> = {
  uploading: "bg-zinc-400",
  ready: "bg-sky-300",
  processing: "bg-signal animate-pulse",
  completed: "bg-signal",
  failed: "bg-red-400",
};

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[8px] tracking-[0.12em] uppercase",
        TONES[status],
        className,
      )}
    >
      <span className={cn("size-1 rounded-full", DOTS[status])} aria-hidden="true" />
      {LABELS[status]}
    </span>
  );
}
