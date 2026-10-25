import {
  ArrowUpRightIcon,
  AudioLinesIcon,
  CaptionsIcon,
  CheckIcon,
  ClapperboardIcon,
  CropIcon,
  PlayIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const WAVEFORM = Array.from({ length: 44 }, (_, index) => {
  const wave = Math.abs(Math.sin(index * 1.37) * 0.65 + Math.sin(index * 0.47) * 0.35);
  return Math.round(18 + wave * 68);
});

const HOOKS = [
  {
    rank: "01",
    time: "00:42",
    title: "The part nobody talks about",
    score: 94,
    active: true,
  },
  {
    rank: "02",
    time: "03:18",
    title: "Consistency is a system",
    score: 88,
    active: false,
  },
  {
    rank: "03",
    time: "07:51",
    title: "Stop chasing the algorithm",
    score: 81,
    active: false,
  },
] as const;

const CLIPS = [
  {
    score: 94,
    duration: "0:42",
    platform: "REELS",
    lines: ["THE PART", "NOBODY", "TALKS ABOUT"],
    highlight: 1,
    surface: "bg-[radial-gradient(circle_at_50%_18%,#4a3820_0%,#1a140d_52%,#080909_100%)]",
    accent: "bg-amber-300/20",
    progress: "72%",
  },
  {
    score: 88,
    duration: "0:37",
    platform: "SHORTS",
    lines: ["CONSISTENCY", "IS A", "SYSTEM"],
    highlight: 2,
    surface: "bg-[radial-gradient(circle_at_50%_18%,#1b3034_0%,#0e1719_52%,#080909_100%)]",
    accent: "bg-sky-300/15",
    progress: "54%",
  },
  {
    score: 81,
    duration: "0:51",
    platform: "TIKTOK",
    lines: ["STOP CHASING", "THE", "ALGORITHM"],
    highlight: 2,
    surface: "bg-[radial-gradient(circle_at_50%_18%,#3d2418_0%,#1a0f0b_52%,#080909_100%)]",
    accent: "bg-orange-300/15",
    progress: "38%",
  },
] as const;

const PIPELINE = ["Transcribe", "Hook scan", "Reframe", "Captions"] as const;

function SourceScene() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.16em] text-zinc-400 uppercase">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-signal" />
          Source / 16:9
        </span>
        <span className="text-zinc-500">00:42:18</span>
      </div>

      <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-[#08090a]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_24%,#5a4126_0%,#241b12_34%,#0a0b0b_76%)]" />
        <div
          className="absolute inset-0 [background-image:repeating-linear-gradient(90deg,transparent_0,transparent_24px,rgba(255,255,255,0.035)_24px,rgba(255,255,255,0.035)_25px)] [mask-image:linear-gradient(to_bottom,black,transparent_88%)] opacity-50"
          aria-hidden="true"
        />
        <div className="absolute top-[8%] right-[12%] h-[58%] w-[28%] rounded-full bg-amber-200/10 blur-2xl" />

        <div className="absolute right-[13%] bottom-[16%] h-[28%] w-[21%] rounded-t-[48%] bg-black/60 blur-[1.5px]" />
        <div className="absolute right-[32%] bottom-[20%] h-[33%] w-px bg-white/20" />
        <div className="absolute right-[30.2%] bottom-[48%] h-[9%] w-[3.8%] rounded-full bg-[#151515] ring-1 ring-white/15" />

        <div className="absolute bottom-[14%] left-[14%] h-[32%] w-[34%] rounded-t-[48%] bg-[#060707]" />
        <div className="absolute bottom-[39%] left-[28%] h-[10%] w-[7%] bg-[#050606]" />
        <div className="absolute bottom-[46%] left-[24%] h-[24%] w-[13%] rounded-[45%] bg-[#040505]" />
        <div className="absolute bottom-[47%] left-[35.5%] h-[22%] w-[2px] rounded-full bg-amber-200/45 blur-[1.5px]" />
        <div className="absolute bottom-[17%] left-[47.5%] h-[29%] w-[2px] rounded-full bg-amber-200/15 blur-[2px]" />

        <div className="absolute inset-x-0 bottom-0 h-[15%] bg-gradient-to-t from-black via-[#0d0a07] to-[#1b140d]/80" />

        <div className="absolute top-[13%] left-[19%] h-[72%] w-[27%] rounded-md border border-signal/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.38)]">
          <span className="absolute -top-px -left-px size-2 border-t border-l border-signal" />
          <span className="absolute -top-px -right-px size-2 border-t border-r border-signal" />
          <span className="absolute -bottom-px -left-px size-2 border-b border-l border-signal" />
          <span className="absolute -right-px -bottom-px size-2 border-r border-b border-signal" />
          <span className="absolute top-1 left-1 rounded-sm bg-primary px-1.5 py-0.5 font-mono text-[7px] font-medium tracking-[0.1em] whitespace-nowrap text-primary-foreground">
            9:16 · CENTER CROP
          </span>
        </div>

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-3">
          <span className="hidden rounded-sm border border-white/10 bg-black/45 px-1.5 py-0.5 font-mono text-[8px] tracking-[0.14em] text-zinc-300 uppercase backdrop-blur-sm sm:inline-flex">
            Source · 04
          </span>
          <span className="rounded-sm border border-white/10 bg-black/45 px-1.5 py-0.5 font-mono text-[8px] tracking-[0.12em] text-zinc-300 backdrop-blur-sm">
            42:18
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent px-3 pt-12 pb-3">
          <p className="text-[13px] font-medium tracking-[-0.02em] text-white">
            How taste compounds
          </p>
          <p className="mt-0.5 font-mono text-[8px] tracking-[0.12em] text-zinc-400 uppercase">
            The Weekly Build · Episode 042
          </p>
        </div>

        <div className="absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 shadow-lg backdrop-blur-md">
          <PlayIcon className="ml-0.5 size-3.5 fill-white text-white" />
        </div>

        <div className="pointer-events-none absolute inset-0 film-grain opacity-[0.16] mix-blend-overlay" />
      </div>

      <div className="flex items-center gap-2.5">
        <span className="font-mono text-[8px] tracking-[0.14em] text-zinc-500 uppercase">
          Audio
        </span>
        <div className="relative flex h-7 flex-1 items-end gap-[2px] overflow-hidden">
          {WAVEFORM.map((height, index) => (
            <span
              key={index}
              className={cn(
                "w-full rounded-full",
                index >= 16 && index <= 27 ? "bg-signal/70" : "bg-white/15",
              )}
              style={{ height: `${height}%` }}
            />
          ))}
          <span className="absolute inset-y-0 left-[48%] w-px bg-signal/70" />
          <span className="absolute top-0 left-[48%] size-1 -translate-x-1/2 rounded-full bg-signal" />
        </div>
        <span className="font-mono text-[8px] tracking-[0.12em] text-zinc-500">-3.2 dB</span>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
        <span className="mt-0.5 font-mono text-[8px] tracking-[0.12em] text-zinc-500 uppercase">
          TR
        </span>
        <p className="text-[10px] leading-relaxed text-zinc-400">
          “The part{" "}
          <span className="bg-primary px-0.5 font-medium text-primary-foreground">nobody</span>{" "}
          talks about…”
        </p>
      </div>
    </div>
  );
}

function HookScan() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.16em] text-zinc-400 uppercase">
        <span className="flex items-center gap-1.5">
          <SparklesIcon className="size-3 text-signal/80" />
          Hook scan
        </span>
        <span className="text-signal/70">12 found</span>
      </div>

      <ol className="mt-3 space-y-2">
        {HOOKS.map((hook) => (
          <li
            key={hook.rank}
            className={cn(
              "rounded-lg border p-2.5",
              hook.active
                ? "border-signal/30 bg-signal/[0.06]"
                : "border-white/[0.06] bg-white/[0.02]",
            )}
          >
            <div className="flex items-center justify-between gap-2 font-mono text-[8px] tracking-[0.12em] text-zinc-500">
              <span>{hook.rank}</span>
              <span>{hook.time}</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug font-medium text-zinc-200">{hook.title}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn("h-full rounded-full", hook.active ? "bg-signal" : "bg-white/30")}
                  style={{ width: `${hook.score}%` }}
                />
              </div>
              <span
                className={cn(
                  "font-mono text-[9px]",
                  hook.active ? "text-signal" : "text-zinc-400",
                )}
              >
                {hook.score}
              </span>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-auto hidden flex-wrap gap-1.5 pt-3 lg:flex">
        <span className="inline-flex items-center gap-1 rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-1 font-mono text-[7px] tracking-[0.1em] text-zinc-400 uppercase">
          <AudioLinesIcon className="size-2.5 text-signal/70" />
          Whisper v3
        </span>
        <span className="inline-flex items-center gap-1 rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-1 font-mono text-[7px] tracking-[0.1em] text-zinc-400 uppercase">
          <CropIcon className="size-2.5 text-signal/70" />
          9:16 crop
        </span>
        <span className="inline-flex items-center gap-1 rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-1 font-mono text-[7px] tracking-[0.1em] text-zinc-400 uppercase">
          <CaptionsIcon className="size-2.5 text-signal/70" />
          Word-level
        </span>
      </div>
    </div>
  );
}

function ClipOutputs() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.16em] text-zinc-400 uppercase">
        <span>Output / 3 clips</span>
        <span className="text-zinc-500">1080 × 1920</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {CLIPS.map((clip) => (
          <div
            key={clip.score}
            className={cn(
              "group relative aspect-[9/16] overflow-hidden rounded-lg border bg-[#080909]",
              clip.score >= 90 ? "border-signal/30" : "border-white/10",
            )}
          >
            <div className={cn("absolute inset-0", clip.surface)} />
            <div
              className={cn(
                "absolute -top-8 left-1/2 h-2/5 w-4/5 -translate-x-1/2 rounded-full blur-2xl",
                clip.accent,
              )}
            />
            <div className="absolute bottom-[16%] left-1/2 h-[34%] w-[54%] -translate-x-1/2 rounded-t-[50%] bg-black/55" />
            <div className="absolute bottom-[42%] left-1/2 h-[18%] w-[30%] -translate-x-1/2 rounded-[45%] bg-black/65" />
            <div className="absolute bottom-[44%] left-[58%] h-[15%] w-[1.5px] rounded-full bg-white/20 blur-[1px]" />
            <div className="absolute bottom-[18%] left-[61%] h-[30%] w-[1.5px] rounded-full bg-white/10 blur-[1px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/10" />
            <div className="pointer-events-none absolute inset-0 film-grain opacity-[0.18] mix-blend-overlay" />

            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-1.5">
              <span className="rounded-full border border-white/15 bg-black/40 px-1.5 py-0.5 font-mono text-[7px] text-white/80 backdrop-blur-sm">
                {clip.duration}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[7px] backdrop-blur-sm",
                  clip.score >= 90
                    ? "border-signal/50 bg-signal/15 text-signal"
                    : "border-white/15 bg-black/40 text-white/75",
                )}
              >
                <span className="size-0.5 rounded-full bg-current" />
                {clip.score}
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[6.5px] tracking-[0.12em] text-white/60">
                  {clip.platform}
                </span>
                <CaptionsIcon className="size-2.5 text-white/50" />
              </div>
              <div className="space-y-0.5 text-[8px] leading-[1.02] font-bold tracking-[-0.02em] text-white sm:text-[9px]">
                {clip.lines.map((line, index) => (
                  <span key={line} className="block">
                    {index === clip.highlight ? (
                      <span className="inline-block bg-primary px-0.5 text-primary-foreground">
                        {line}
                      </span>
                    ) : (
                      line
                    )}
                  </span>
                ))}
              </div>
              <div className="mt-2 h-px w-full bg-white/20">
                <div className="h-px bg-signal" style={{ width: clip.progress }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto hidden items-center justify-between gap-3 pt-3 font-mono text-[8px] tracking-[0.12em] text-zinc-500 uppercase sm:flex">
        <span>01:14 — 01:56</span>
        <span className="text-signal/70">Hook score 94</span>
      </div>
    </div>
  );
}

export function HeroConsole() {
  return (
    <div className="relative mx-auto mt-8 w-full max-w-[1180px] sm:mt-12">
      <div
        className="pointer-events-none absolute -inset-x-16 -top-16 bottom-0 -z-10 animate-ambient bg-[radial-gradient(ellipse_at_50%_20%,rgba(0,71,171,0.26),transparent_65%)] blur-2xl"
        aria-hidden="true"
      />

      <div className="relative">
        <span
          className="absolute -top-2 -left-2 hidden size-4 border-t border-l border-signal/35 sm:block"
          aria-hidden="true"
        />
        <span
          className="absolute -top-2 -right-2 hidden size-4 border-t border-r border-signal/35 sm:block"
          aria-hidden="true"
        />
        <span
          className="absolute -bottom-2 -left-2 hidden size-4 border-b border-l border-signal/35 sm:block"
          aria-hidden="true"
        />
        <span
          className="absolute -right-2 -bottom-2 hidden size-4 border-r border-b border-signal/35 sm:block"
          aria-hidden="true"
        />

        <div
          className="relative animate-clip-in overflow-hidden rounded-2xl border border-white/10 bg-[#090a0b]/92 shadow-[0_50px_140px_-40px_rgba(0,0,0,1),0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-2xl [animation-delay:360ms]"
          role="img"
          aria-label="ClipMax interface preview: a 16:9 podcast source is cropped to 9:16, scanned for hooks, and turned into three vertical clips with captions, durations, and hook scores."
        >
          <div aria-hidden="true">
            <div className="flex h-11 items-center justify-between gap-4 border-b border-white/[0.06] px-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-2.5">
                <ClapperboardIcon className="size-3.5 shrink-0 text-signal/80" />
                <span className="truncate font-mono text-[8.5px] tracking-[0.16em] text-zinc-400 uppercase">
                  ClipMax / Cutting room
                </span>
                <span className="hidden h-3 w-px bg-white/10 sm:block" />
                <span className="hidden font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase sm:inline">
                  Project 014 — sample
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase sm:inline">
                  16:9 → 9:16
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/25 bg-signal/[0.07] px-2 py-1 font-mono text-[8px] tracking-[0.14em] text-signal uppercase">
                  <span className="size-1 rounded-full bg-signal" />
                  Preview
                </span>
              </div>
            </div>

            <div className="grid gap-px bg-white/[0.06] lg:grid-cols-[1.35fr_0.8fr_1.15fr]">
              <div className="bg-[#0a0b0c] p-3 sm:p-4">
                <SourceScene />
              </div>
              <div className="bg-[#090a0b] p-3 sm:p-4">
                <HookScan />
              </div>
              <div className="bg-[#0b0c0d] p-3 sm:p-4">
                <ClipOutputs />
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-white/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[8px] tracking-[0.12em] text-zinc-500 uppercase">
                <span className="size-1.5 rounded-full bg-signal" />
                <span className="text-zinc-300">3 clips ready</span>
                <span className="text-zinc-700">/</span>
                <span>6.8 credits</span>
                <span className="text-zinc-700">/</span>
                <span>02:41 elapsed</span>
                <span className="rounded border border-white/[0.08] px-1.5 py-0.5 text-[7px] text-zinc-500">
                  Sample project
                </span>
              </div>

              <div className="hidden items-center gap-3 font-mono text-[8px] tracking-[0.12em] text-zinc-500 uppercase md:flex">
                {PIPELINE.map((step) => (
                  <span key={step} className="flex items-center gap-1">
                    <CheckIcon className="size-2.5 text-signal/80" />
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute -top-5 right-8 hidden items-center gap-2 rounded-full border border-white/10 bg-[#0c0d0e]/90 px-3 py-1.5 shadow-xl backdrop-blur-md xl:flex"
          aria-hidden="true"
        >
          <SparklesIcon className="size-3 text-signal" />
          <span className="font-mono text-[8px] tracking-[0.14em] text-zinc-300 uppercase">
            Hook score 94
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase">
          Interface preview · sample project, not a live render
        </p>
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-1.5 font-mono text-[8px] tracking-[0.14em] text-zinc-400 uppercase transition-colors hover:text-signal"
        >
          Open the studio
          <ArrowUpRightIcon className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </div>
  );
}
