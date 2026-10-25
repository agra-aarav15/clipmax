import { ArrowUpRightIcon, CheckIcon } from "lucide-react";
import Link from "next/link";

import { ScrollFloat } from "@/components/landing/scroll-float";
import { Button } from "@/components/ui/button";

const PROOF = ["30 free credits", "15-minute sources", "No card required"] as const;

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_55%_at_50%_8%,rgba(21,94,239,0.28),transparent_68%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_35%_30%_at_50%_28%,rgba(155,231,255,0.08),transparent_70%)]" />
        <div className="absolute top-1/2 left-1/2 size-[78rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.035]" />
        <div className="absolute top-1/2 left-1/2 size-[56rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />
        <div className="absolute top-1/2 left-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05]" />
        <div className="absolute inset-0 hero-dots [mask-image:radial-gradient(ellipse_at_50%_45%,black,transparent_68%)] opacity-[0.18]" />
        <div className="absolute inset-0 film-grain opacity-[0.05] mix-blend-overlay" />
      </div>

      <div className="mx-auto max-w-[1320px] px-5 py-28 sm:px-8 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <p className="flex items-center justify-center gap-3 font-mono text-[9px] tracking-[0.2em] text-zinc-500 uppercase">
            <span className="h-px w-8 bg-white/15" aria-hidden="true" />
            Start with the long version
            <span className="h-px w-8 bg-white/15" aria-hidden="true" />
          </p>

          <ScrollFloat
            className="mt-6"
            textClassName="inline-block pb-[0.08em] font-serif text-[clamp(2.6rem,6.8vw,5.6rem)] leading-[0.95] font-normal tracking-[-0.035em] text-white italic"
            effect="float"
            splitBy="words"
            fromColor="#9be7ff"
            scrollStart="top bottom-=8%"
            scrollEnd="top 68%"
            stagger={0.05}
            distance={55}
            stretch={1.4}
            ease="power3.out"
          >
            Bring the long version.
          </ScrollFloat>

          <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-pretty text-zinc-400">
            One upload. A week of short clips. The hooks, the crop, and the captions handled in one
            private pipeline.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Button asChild size="lg" className="h-12 w-full rounded-xl px-6 text-[14px] sm:w-auto">
              <Link href="/signup">
                Start free
                <ArrowUpRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-xl border-white/10 bg-white/[0.02] px-6 text-[14px] sm:w-auto"
            >
              <Link href="/dashboard">Open the studio</Link>
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[8px] tracking-[0.14em] text-zinc-500 uppercase">
            {PROOF.map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckIcon className="size-3 text-signal/80" aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
