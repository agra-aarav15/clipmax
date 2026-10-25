import {
  MAX_SOURCE_BYTES,
  MAX_SOURCE_DURATION_MINUTES,
  SUPPORTED_SOURCE_HOSTS,
  creditsForDurationSeconds,
} from "@clipmax/shared";
import {
  ArrowUpRightIcon,
  AudioLinesIcon,
  ClapperboardIcon,
  SparklesIcon,
  UploadCloudIcon,
} from "lucide-react";
import Link from "next/link";

import { SectionKicker } from "@/components/landing/section-kicker";

const maxCredits = creditsForDurationSeconds(MAX_SOURCE_DURATION_MINUTES * 60);
const maxMegabytes = Math.round(MAX_SOURCE_BYTES / (1024 * 1024));

const STEPS = [
  {
    icon: UploadCloudIcon,
    eyebrow: "Intake",
    meta: `Presigned PUT · ${MAX_SOURCE_DURATION_MINUTES} min · ${maxMegabytes} MB`,
    title: "Drop the long version.",
    body: "Upload an MP4, MOV, or WebM, or paste a public link. The browser sends the file straight to private R2 with a presigned PUT — the app server never proxies video.",
    chips: ["MP4 · MOV · WebM", `${SUPPORTED_SOURCE_HOSTS.length} allowlisted hosts`],
  },
  {
    icon: AudioLinesIcon,
    eyebrow: "Transcribe",
    meta: "Word timestamps",
    title: "Hear every word.",
    body: "Whisper returns word-level timestamps. That is what keeps captions on the syllable instead of drifting a beat behind the audio.",
    chips: ["OpenAI Whisper", "Language aware"],
  },
  {
    icon: SparklesIcon,
    eyebrow: "Find the hooks",
    meta: "Structured output",
    title: "Choose the moments worth posting.",
    body: "Candidate moments are scored for a strong opening, a standalone idea, and a clean ending. If the model is unavailable, a density-based fallback still returns timecoded cuts.",
    chips: ["Hook scoring", "Density fallback"],
  },
  {
    icon: ClapperboardIcon,
    eyebrow: "Render",
    meta: "1080 × 1920 · 30 fps",
    title: "Cut, caption, hand it back.",
    body: "FFmpeg crops to 9:16, burns the caption preset into the frame, and writes an H.264 MP4 back to R2. Previews are short-lived signed URLs, not public links.",
    chips: ["libass captions", "AAC · faststart"],
  },
] as const;

export function WorkflowSection() {
  return (
    <section id="pipeline" className="relative scroll-mt-24 border-b border-white/[0.06]">
      <div className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 sm:py-28 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div data-reveal>
              <SectionKicker index="02">Workflow</SectionKicker>
              <h2 className="mt-5 text-[clamp(2.1rem,3.9vw,3.4rem)] leading-[0.98] font-semibold tracking-[-0.055em] text-balance">
                One upload.
                <br />
                <span className="font-serif text-[1.06em] leading-[0.85] font-normal tracking-[-0.02em] text-signal italic">
                  Four moves.
                </span>
              </h2>
              <p className="mt-5 max-w-[34rem] text-[15px] leading-relaxed text-pretty text-zinc-400">
                No timeline, no export presets, no browser tab to babysit. Each move is a queued job
                with a real status and a real retry path.
              </p>
              <Link
                href="#pricing"
                className="group mt-5 inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.14em] text-zinc-400 uppercase transition-colors hover:text-signal"
              >
                See the credit rules
                <ArrowUpRightIcon className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            <div
              data-reveal
              className="mt-9 hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 lg:block"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[8px] tracking-[0.16em] text-zinc-500 uppercase">
                    Source length
                  </p>
                  <p className="mt-1 text-[13px] text-zinc-400">
                    {MAX_SOURCE_DURATION_MINUTES} minutes, reserved up front
                  </p>
                </div>
                <p className="whitespace-nowrap text-zinc-300">
                  <span className="text-2xl font-semibold tracking-tight">{maxCredits}</span>
                  <span className="ml-1 font-mono text-[9px] tracking-[0.12em] text-zinc-500 uppercase">
                    credits
                  </span>
                </p>
              </div>

              <div className="mt-4 flex gap-1" aria-hidden="true">
                {Array.from({ length: MAX_SOURCE_DURATION_MINUTES }, (_, index) => (
                  <span
                    key={index}
                    data-credit-tick
                    className="h-6 flex-1 origin-bottom rounded-[3px] border border-signal/25 bg-signal/[0.12]"
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between font-mono text-[8px] tracking-[0.12em] text-zinc-600 uppercase">
                <span>1 min / 1 credit</span>
                <span>{MAX_SOURCE_DURATION_MINUTES} min max</span>
              </div>

              <p className="mt-4 border-t border-white/[0.07] pt-4 text-xs leading-relaxed text-zinc-500">
                Unused minutes return when the job settles. The math runs in Postgres, never in the
                browser.
              </p>
            </div>
          </div>

          <ol className="relative">
            <div
              data-workflow-rail
              className="absolute top-2 bottom-2 left-[7px] w-px bg-white/[0.09]"
              aria-hidden="true"
            >
              <div
                data-workflow-progress
                className="h-full w-full origin-top bg-gradient-to-b from-signal via-signal/60 to-signal/15"
              />
            </div>

            {STEPS.map((step, index) => (
              <li key={step.eyebrow} className="group relative pb-10 pl-9 last:pb-0 sm:pl-12">
                <span
                  className="absolute top-1.5 left-0 grid size-[15px] place-items-center rounded-full border border-white/15 bg-[#08090a] transition-colors duration-300 group-hover:border-signal/50"
                  aria-hidden="true"
                >
                  <span className="size-1 rounded-full bg-signal/50 transition-colors duration-300 group-hover:bg-signal" />
                </span>

                <div
                  data-reveal
                  className="border-b border-white/[0.06] pb-10 transition-colors duration-300 group-last:border-0 group-last:pb-0"
                >
                  <div className="flex items-start justify-between gap-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[8px] tracking-[0.15em] uppercase">
                        <span className="text-signal">
                          0{index + 1} / {step.eyebrow}
                        </span>
                        <span className="size-0.5 rounded-full bg-zinc-700" aria-hidden="true" />
                        <span className="text-zinc-600">{step.meta}</span>
                      </div>

                      <h3 className="mt-3 text-[clamp(1.35rem,2.1vw,1.75rem)] leading-tight font-medium tracking-[-0.035em]">
                        {step.title}
                      </h3>
                      <p className="mt-2 max-w-[42rem] text-sm leading-relaxed text-zinc-400">
                        {step.body}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {step.chips.map((chip) => (
                          <span
                            key={chip}
                            className="rounded-md border border-white/[0.07] bg-white/[0.025] px-2 py-1 font-mono text-[8px] tracking-[0.1em] text-zinc-500 uppercase"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>

                    <span className="hidden size-10 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.02] transition-colors duration-300 group-hover:border-signal/25 group-hover:bg-signal/[0.04] sm:grid">
                      <step.icon
                        className="size-4 text-zinc-500 transition-colors duration-300 group-hover:text-signal"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
