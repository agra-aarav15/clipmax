import {
  ArrowUpRightIcon,
  CaptionsIcon,
  Clock3Icon,
  FrameIcon,
  InfoIcon,
  Link2Icon,
  ScanLineIcon,
} from "lucide-react";
import Link from "next/link";

import { SampleClipPoster, type SampleClipData } from "@/components/landing/sample-clip-poster";
import { SectionKicker } from "@/components/landing/section-kicker";

const SAMPLE_CLIPS: SampleClipData[] = [
  {
    id: "01",
    scene: "amber",
    platform: "Reels",
    duration: "0:42",
    score: 94,
    lines: ["THE PART", "NOBODY", "TALKS ABOUT"],
    highlight: 1,
    progress: "72%",
  },
  {
    id: "02",
    scene: "teal",
    platform: "Shorts",
    duration: "0:37",
    score: 88,
    lines: ["CONSISTENCY", "IS A", "SYSTEM"],
    highlight: 2,
    progress: "54%",
  },
  {
    id: "03",
    scene: "rust",
    platform: "TikTok",
    duration: "0:51",
    score: 81,
    lines: ["STOP CHASING", "THE", "ALGORITHM"],
    highlight: 2,
    progress: "38%",
  },
];

const SPECS = [
  {
    icon: FrameIcon,
    label: "9:16 · 1080 × 1920",
    body: "Vertical crop and scale handled by FFmpeg, not a browser preview.",
  },
  {
    icon: CaptionsIcon,
    label: "Word-level captions",
    body: "Burned into the frame with libass, so they travel with the file.",
  },
  {
    icon: ScanLineIcon,
    label: "H.264 · 30 fps",
    body: "yuv420p, AAC audio, faststart. Ready for every short-form feed.",
  },
  {
    icon: Link2Icon,
    label: "Signed previews",
    body: "One-hour GET URLs minted per request. The bucket stays private.",
  },
] as const;

export function PreviewSection() {
  return (
    <section
      id="preview"
      className="relative scroll-mt-24 overflow-hidden border-b border-white/[0.06]"
    >
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_82%_4%,rgba(0,71,171,0.18),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_35%_at_8%_80%,rgba(137,207,240,0.055),transparent_70%)]" />
        <div className="absolute inset-0 hero-dots opacity-[0.14] [mask-image:linear-gradient(to_bottom,black,transparent_62%)]" />
      </div>

      <div className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 sm:py-28 lg:py-32">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:gap-12">
          <div data-reveal>
            <SectionKicker index="01">Sample output</SectionKicker>
            <h2 className="mt-5 max-w-[18ch] text-[clamp(2.3rem,4.8vw,4.15rem)] leading-[0.98] font-semibold tracking-[-0.055em] text-balance">
              Every good moment,
              <br />
              <span className="font-serif text-[1.06em] leading-[0.85] font-normal tracking-[-0.02em] text-signal italic">
                already cut.
              </span>
            </h2>
          </div>

          <div data-reveal className="max-w-sm lg:pb-2">
            <p className="text-[15px] leading-relaxed text-pretty text-zinc-400">
              Hooks, cut boundaries, caption emphasis. This is the shape of an export: vertical,
              captioned, and ready to post.
            </p>
            <p className="mt-4 flex items-start gap-2 border-t border-white/[0.07] pt-4 text-[11px] leading-relaxed text-zinc-500">
              <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-signal/70" aria-hidden="true" />
              Art-directed sample project. Not a customer result, and not a live render.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start">
          <div>
            <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 [scrollbar-width:none] sm:gap-5 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
              {SAMPLE_CLIPS.map((clip, index) => (
                <div
                  key={clip.id}
                  data-parallax={index === 1 ? -3 : 3}
                  className="w-[68vw] max-w-[300px] shrink-0 snap-center md:w-auto md:max-w-none"
                >
                  <SampleClipPoster
                    clip={clip}
                    className={index === 0 ? "border-signal/25" : undefined}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase">
              <span className="flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-signal/80" />
                Hook scores shown are sample values
              </span>
              <Link
                href="/dashboard"
                className="hidden items-center gap-1.5 text-zinc-400 transition-colors hover:text-signal sm:flex"
              >
                Open the cutting room
                <ArrowUpRightIcon className="size-3" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <aside
            data-reveal
            className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6"
          >
            <div
              className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-primary/20 blur-[70px]"
              aria-hidden="true"
            />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[8px] tracking-[0.16em] text-zinc-500 uppercase">
                  Hook dossier · sample 01
                </span>
                <span className="flex items-center gap-1 rounded-full border border-signal/30 bg-signal/[0.08] px-2 py-0.5 font-mono text-[9px] text-signal">
                  <span className="size-1 rounded-full bg-signal" />
                  94
                </span>
              </div>

              <p className="mt-5 font-serif text-[clamp(1.8rem,2.5vw,2.15rem)] leading-[1.02] tracking-[-0.02em] text-white italic">
                “The part nobody talks about.”
              </p>

              <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-white/[0.08] pt-5">
                {[
                  ["Timecode", "00:42 — 01:24"],
                  ["Length", "0:42"],
                  ["Captions", "Word-level"],
                  ["Frame", "1080 × 1920"],
                ].map(([term, value]) => (
                  <div key={term}>
                    <dt className="font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase">
                      {term}
                    </dt>
                    <dd className="mt-1 text-[13px] text-zinc-300">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 border-t border-white/[0.08] pt-5">
                <p className="font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase">
                  Why this cut
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
                  A contradiction in the opening line, then a story that pays it off. The first
                  three seconds carry the hook; the ending lands on a complete thought.
                </p>
              </div>

              <div className="mt-5 flex items-start gap-2 rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2.5 text-[11px] leading-relaxed text-zinc-500">
                <Clock3Icon className="mt-0.5 size-3.5 shrink-0 text-signal/70" aria-hidden="true" />
                The worker chooses cut boundaries from the transcript. Nothing is trimmed by hand
                after the fact.
              </div>
            </div>
          </aside>
        </div>

        <div
          data-reveal
          className="mt-12 grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4"
        >
          {SPECS.map((spec) => (
            <div key={spec.label} className="bg-[#090a0b] p-4 sm:p-5">
              <spec.icon className="size-4 text-signal/80" aria-hidden="true" />
              <p className="mt-3 font-mono text-[9px] tracking-[0.12em] text-zinc-300 uppercase">
                {spec.label}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{spec.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
