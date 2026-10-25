import { MAX_SOURCE_DURATION_MINUTES } from "@clipmax/shared";
import { ArrowDownIcon, CheckIcon } from "lucide-react";
import Link from "next/link";

import { HeroConsole } from "@/components/landing/hero-console";
import { SourceIntake } from "@/components/landing/source-intake";

const PROOF_POINTS = [
  `${MAX_SOURCE_DURATION_MINUTES}-min source`,
  "1080 × 1920",
  "Word-level captions",
] as const;

const CONTENT_TYPES = ["Podcasts", "Interviews", "Webinars", "Courses", "Livestreams"] as const;

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden border-b border-white/[0.06]">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_72%_-5%,rgba(0,71,171,0.24),transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_16%_35%,rgba(137,207,240,0.09),transparent_68%)]" />
        <div className="absolute inset-0 hero-dots [mask-image:linear-gradient(to_bottom,black,transparent_82%)] opacity-[0.38]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="absolute inset-0 film-grain opacity-[0.055] mix-blend-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="pt-12 sm:pt-16 lg:pt-20">
          <div className="mx-auto max-w-[62rem] text-center">
            <div className="flex animate-rise justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[9px] tracking-[0.16em] text-zinc-300 uppercase backdrop-blur">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-50" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-signal" />
                </span>
                Private beta · 30 free credits
                <span className="h-3 w-px bg-white/10" />
                <span className="text-zinc-500">v0.1</span>
              </span>
            </div>

            <h1 className="mt-5 animate-rise text-[clamp(2.5rem,6.6vw,5.9rem)] leading-[0.92] font-semibold tracking-[-0.06em] text-balance [animation-delay:80ms]">
              Long video in.
              <br />A week of{" "}
              <span className="font-serif text-[1.06em] leading-[0.8] font-normal tracking-[-0.03em] text-signal italic">
                clips
              </span>{" "}
              out.
            </h1>

            <p className="mx-auto mt-5 max-w-[42rem] animate-rise text-[15px] leading-relaxed text-pretty text-zinc-400 [animation-delay:160ms] sm:text-[17px]">
              ClipMax finds the hooks, crops to 9:16, and burns word-level captions — so one
              recording becomes a week of short clips. No timeline required.
            </p>

            <div className="mt-7">
              <SourceIntake />
            </div>

            <div className="mt-4 flex animate-rise flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[9px] tracking-[0.12em] text-zinc-500 uppercase [animation-delay:320ms]">
              {PROOF_POINTS.map((point) => (
                <span key={point} className="flex items-center gap-1.5">
                  <CheckIcon className="size-3 text-signal" />
                  {point}
                </span>
              ))}
              <Link
                href="#pipeline"
                className="group hidden items-center gap-1.5 transition-colors hover:text-foreground sm:flex"
              >
                See the 4-step pipeline
                <ArrowDownIcon className="size-3 transition-transform group-hover:translate-y-0.5" />
              </Link>
            </div>
          </div>

          <HeroConsole />

          <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.06] py-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-mono text-[8px] tracking-[0.16em] text-zinc-400 uppercase">
              Built for the long version
            </span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {CONTENT_TYPES.map((type, index) => (
                <span
                  key={type}
                  className="flex items-center gap-4 font-mono text-[8px] tracking-[0.14em] text-zinc-500 uppercase"
                >
                  {index > 0 ? <span className="size-0.5 rounded-full bg-zinc-700" /> : null}
                  {type}
                </span>
              ))}
            </div>
            <span className="hidden font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase lg:block">
              Source → 9:16
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
