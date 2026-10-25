import type { ClipRenderStatus } from "@clipmax/shared";
import { CaptionsIcon, DownloadIcon, Loader2Icon, TriangleAlertIcon } from "lucide-react";

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

const STATUS_TONE: Record<ClipRenderStatus, string> = {
  draft: "text-zinc-500",
  queued: "text-sky-200",
  rendering: "text-signal",
  rendered: "text-signal",
  failed: "text-red-300",
};

function ClipStage({ clip }: { clip: ClipView }) {
  const rendered = clip.renderStatus === "rendered";

  if (rendered && clip.previewUrl) {
    return (
      <video
        className="h-full w-full object-cover"
        controls
        preload="none"
        playsInline
        poster={clip.thumbnailUrl ?? undefined}
        aria-label={`${clip.title}. Vertical clip with burned-in captions.`}
      >
        <source src={clip.previewUrl} type="video/mp4" />
        Your browser does not support embedded video. Download the clip instead.
      </video>
    );
  }

  const active = clip.renderStatus === "queued" || clip.renderStatus === "rendering";

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0b0d]">
      {clip.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived R2 URL
        <img
          src={clip.thumbnailUrl}
          alt=""
          className="h-full w-full object-cover opacity-35 blur-[1px]"
          loading="lazy"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(21,94,239,0.3),transparent_62%)]"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-x-5 top-5 bottom-5 rounded-md border border-white/[0.06]"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-6 text-center">
        {clip.renderStatus === "failed" ? (
          <>
            <span className="grid size-9 place-items-center rounded-full border border-destructive/30 bg-destructive/10">
              <TriangleAlertIcon className="size-4 text-red-300" />
            </span>
            <p className="text-[11.5px] leading-relaxed text-zinc-400">
              This clip failed to render. Retry the project once the current job has stopped.
            </p>
          </>
        ) : (
          <>
            <span className="grid size-9 place-items-center rounded-full border border-signal/25 bg-signal/[0.07]">
              {active ? (
                <Loader2Icon className="size-4 animate-spin text-signal" />
              ) : (
                <CaptionsIcon className="size-4 text-signal" />
              )}
            </span>
            <p className="text-[11.5px] leading-relaxed text-zinc-400">
              {active
                ? "FFmpeg is cropping to 9:16 and burning captions."
                : "Waiting for the render step."}
            </p>
          </>
        )}
      </div>
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
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0c0e] transition-colors duration-300 hover:border-white/[0.13]">
      <div className="relative aspect-[9/16] overflow-hidden bg-black">
        <ClipStage clip={clip} />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/65 to-transparent p-2.5">
          <span className="rounded-md border border-white/12 bg-black/50 px-1.5 py-1 font-mono text-[7.5px] tracking-[0.16em] text-white/70 uppercase backdrop-blur-sm">
            {String(index + 1).padStart(2, "0")} / 9:16
          </span>
          {clip.viralityScore !== null ? (
            <span
              className={cn(
                "rounded-md border px-1.5 py-1 font-mono text-[7.5px] tracking-[0.1em] backdrop-blur-sm",
                clip.viralityScore >= 85
                  ? "border-signal/35 bg-signal/[0.14] text-signal"
                  : "border-white/12 bg-black/50 text-white/65",
              )}
              title="Hook score chosen by the highlight step"
            >
              {clip.viralityScore}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2 font-mono text-[8px] tracking-[0.12em] uppercase">
          <span className="text-zinc-500">
            {formatTimeRange(clip.startTime, clip.endTime)}
          </span>
          <span className={cn("flex items-center gap-1.5", STATUS_TONE[clip.renderStatus])}>
            <span
              aria-hidden="true"
              className={cn(
                "size-1 rounded-full bg-current",
                clip.renderStatus === "rendering" && "animate-pulse",
              )}
            />
            {STATUS_LABEL[clip.renderStatus]}
          </span>
        </div>

        <h3 className="mt-2.5 line-clamp-2 text-[13.5px] leading-snug font-medium tracking-[-0.01em] text-zinc-100">
          {clip.title}
        </h3>

        {clip.hookText ? (
          <p className="mt-2 border-l border-signal/30 pl-2.5 font-serif text-[0.95rem] leading-snug text-zinc-300 italic">
            “{clip.hookText}”
          </p>
        ) : null}

        {clip.reasoning ? (
          <p className="mt-2.5 line-clamp-3 text-[11px] leading-relaxed text-zinc-500">
            {clip.reasoning}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="font-mono text-[8px] tracking-[0.1em] text-zinc-600 uppercase">
            {formatClipLength(clip.startTime, clip.endTime)} · 1080×1920
          </span>

          <div className="flex items-center gap-2">
            {hasTranscript ? (
              <a
                href="#transcript"
                className="text-[10.5px] text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-200 hover:underline"
              >
                Transcript
              </a>
            ) : null}
            {playable ? (
              <Button asChild size="sm" variant="outline" className="h-8 border-white/12 px-2.5">
                <a href={`/api/clips/${clip.id}/download`}>
                  <DownloadIcon className="size-3.5" />
                  Download
                </a>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-white/[0.07] px-2.5 text-zinc-500"
                disabled
              >
                <DownloadIcon className="size-3.5" />
                Download
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
