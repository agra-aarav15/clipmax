import type { ClipRenderStatus } from "@clipmax/shared";
import { CaptionsIcon, DownloadIcon, Loader2Icon, TriangleAlertIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatClipLength, formatTimeRange } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ClipView = {
  id: string;
  title: string;
  hookText: string | null;
  startTime: number;
  endTime: number;
  viralityScore: number | null;
  reasoning: string | null;
  renderStatus: ClipRenderStatus;
  previewUrl: string | null;
  thumbnailUrl: string | null;
};

const STATUS_LABEL: Record<ClipRenderStatus, string> = {
  draft: "Draft",
  queued: "Queued",
  rendering: "Rendering",
  rendered: "Rendered",
  failed: "Failed",
};

function ClipPlaceholder({ status }: { status: ClipRenderStatus }) {
  if (status === "failed") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <TriangleAlertIcon className="size-5 text-destructive" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          This clip failed to render. Use “Retry project” after the current job stops.
        </p>
      </div>
    );
  }

  const active = status === "rendering" || status === "queued";

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      {active ? (
        <Loader2Icon className="size-5 animate-spin text-signal" />
      ) : (
        <CaptionsIcon className="size-5 text-signal/70" />
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        {active
          ? "FFmpeg is framing and captioning this clip."
          : "This clip is waiting for the render step."}
      </p>
    </div>
  );
}

export function ClipCard({
  clip,
  index,
  hasTranscript,
}: {
  clip: ClipView;
  index: number;
  hasTranscript: boolean;
}) {
  const rendered = clip.renderStatus === "rendered";
  const playable = rendered && Boolean(clip.previewUrl);

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[9/16] overflow-hidden bg-[#08090a]">
        {playable ? (
          <video
            className="h-full w-full object-cover"
            controls
            preload="none"
            playsInline
            poster={clip.thumbnailUrl ?? undefined}
            aria-label={`${clip.title}. Vertical clip with burned-in captions.`}
          >
            <source src={clip.previewUrl ?? undefined} type="video/mp4" />
            Your browser does not support embedded video. Download the clip instead.
          </video>
        ) : clip.thumbnailUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived R2 URL */}
            <img
              src={clip.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover opacity-60"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40">
              <ClipPlaceholder status={clip.renderStatus} />
            </div>
          </>
        ) : (
          <ClipPlaceholder status={clip.renderStatus} />
        )}

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="rounded-full border border-white/15 bg-black/55 px-2 py-1 font-mono text-[8px] tracking-[0.14em] text-white/75 uppercase backdrop-blur-sm">
            Clip {String(index + 1).padStart(2, "0")}
          </span>
          {clip.viralityScore !== null ? (
            <span
              className={cn(
                "rounded-full border px-2 py-1 font-mono text-[8px] font-medium backdrop-blur-sm",
                clip.viralityScore >= 85
                  ? "border-signal/40 bg-signal/15 text-signal"
                  : "border-white/15 bg-black/55 text-white/70",
              )}
              title="Hook score chosen by the highlight step"
            >
              {clip.viralityScore}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium tracking-tight">{clip.title}</h3>
            <p className="mt-1 font-mono text-[0.625rem] tracking-[0.08em] text-muted-foreground">
              {formatTimeRange(clip.startTime, clip.endTime)} ·{" "}
              {formatClipLength(clip.startTime, clip.endTime)}
            </p>
          </div>
          <Badge
            variant={rendered ? "outline" : "muted"}
            className={rendered ? "border-signal/25 text-signal" : undefined}
          >
            {STATUS_LABEL[clip.renderStatus]}
          </Badge>
        </div>

        {clip.hookText ? (
          <p className="mt-3 border-l border-signal/30 pl-2.5 font-serif text-[0.95rem] leading-snug text-zinc-200 italic">
            “{clip.hookText}”
          </p>
        ) : null}

        {clip.reasoning ? (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{clip.reasoning}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <Button asChild size="sm" variant={playable ? "default" : "outline"} disabled={!playable}>
            {playable ? (
              <a href={`/api/clips/${clip.id}/download`}>
                <DownloadIcon />
                Download
              </a>
            ) : (
              <span aria-disabled="true">
                <DownloadIcon />
                Download
              </span>
            )}
          </Button>

          {hasTranscript ? (
            <a
              href="#transcript"
              className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Transcript
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
