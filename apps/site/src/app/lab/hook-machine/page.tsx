import { ArrowRightIcon, CheckIcon, PlayIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ClipMaxMark } from "@/components/brand/clipmax-mark";
import { LabNav } from "../../../components/lab-nav";

export const metadata: Metadata = {
  title: "Hook Machine · Design lab",
  description:
    "A kinetic ClipMax landing page where the product performs its own feature: burned captions, one word at a time.",
};

const MOMENTS = [
  {
    time: "00:12:40",
    score: "94",
    hook: "Nobody tells you the first year is the quiet one.",
    quote: "The first year is the quiet one",
  },
  {
    time: "00:26:18",
    score: "91",
    hook: "I almost quit in month nine. Then one clip changed the year.",
    quote: "I almost quit in month nine",
  },
  {
    time: "00:38:02",
    score: "89",
    hook: "You do not need more ideas. You need the nerve to cut.",
    quote: "You need the nerve to cut",
  },
] as const;

export default function HookMachinePage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-black text-[#F4F2ED]">
      <LabNav active="hook-machine" />

      <header className="border-b border-white/10">
        <div className="mx-auto flex h-[72px] w-full max-w-[1320px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="ClipMax home">
            <ClipMaxMark className="size-7 text-[#D8FF3E]" />
            <span className="text-[17px] font-semibold tracking-[-0.03em]">ClipMax</span>
          </Link>

          <nav className="hidden items-center gap-7 text-[12px] text-[#8A867E] md:flex">
            <a href="#passes" className="transition-colors hover:text-[#F4F2ED]">
              How it cuts
            </a>
            <a href="#moments" className="transition-colors hover:text-[#F4F2ED]">
              Moments
            </a>
            <a href="#price" className="transition-colors hover:text-[#F4F2ED]">
              Price
            </a>
          </nav>

          <Link
            href="/signup"
            className="inline-flex h-9 items-center gap-1.5 bg-[#D8FF3E] px-4 text-[12px] font-semibold text-black transition-[filter,transform] hover:brightness-105 active:scale-[0.99]"
          >
            Start free
            <ArrowRightIcon className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-[1320px] gap-12 px-5 pt-12 pb-16 sm:px-8 sm:pt-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-12 lg:pt-20 lg:pb-24">
          <div>
            <p className="flex items-center gap-2 text-[11px] text-[#8A867E]">
              <span className="size-1.5 rounded-full bg-[#D8FF3E]" aria-hidden="true" />
              Captions that hold the scroll
            </p>

            <h1 className="mt-5 max-w-[13ch] text-[clamp(2.7rem,6vw,4.9rem)] leading-[0.88] font-bold tracking-[-0.055em] text-balance uppercase">
              Long video in.
              <br />
              <span className="text-[#D8FF3E]">A week</span> of
              <br />
              clips out.
            </h1>

            <p className="mt-5 max-w-[30rem] text-[15px] leading-relaxed text-pretty text-[#8A867E]">
              The strongest sentence in a 40-minute recording is already there. ClipMax finds it,
              cuts around it, and burns it into 9:16 so the first frame does the work.
            </p>

            <div className="mt-7 flex max-w-[32rem] flex-col gap-2 sm:flex-row">
              <div className="flex h-11 min-w-0 flex-1 items-center border border-white/15 bg-white/[0.03] px-3">
                <span className="truncate font-mono text-[11px] text-[#8A867E]">
                  paste a public video link…
                </span>
              </div>
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center gap-1.5 bg-[#F4F2ED] px-5 text-[12px] font-semibold text-black transition-[filter,transform] hover:brightness-95 active:scale-[0.99]"
              >
                Cut it
                <ArrowRightIcon className="size-3.5" aria-hidden="true" />
              </Link>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[#8A867E]">
              {["15-minute sources", "1080 × 1920", "Burned word-level captions"].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <CheckIcon className="size-3 text-[#D8FF3E]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Caption canvas */}
          <div className="relative mx-auto w-full max-w-[440px]">
            <div className="relative aspect-[9/16] overflow-hidden border border-white/15 bg-[#080808]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(216,255,62,0.10),transparent_58%)]" />
              <div className="absolute inset-0 film-grain opacity-[0.06]" aria-hidden="true" />

              <span className="absolute top-4 left-4 size-3 border-t border-l border-white/25" />
              <span className="absolute top-4 right-4 size-3 border-t border-r border-white/25" />
              <span className="absolute bottom-4 left-4 size-3 border-b border-l border-white/25" />
              <span className="absolute right-4 bottom-4 size-3 border-r border-b border-white/25" />

              <div className="absolute inset-x-5 top-4 flex items-center justify-between">
                <span className="font-mono text-[8px] tracking-[0.12em] text-[#8A867E] uppercase">
                  Sample · 00:12:40
                </span>
                <span className="border border-[#D8FF3E]/40 px-1.5 py-0.5 font-mono text-[8px] tracking-[0.08em] text-[#D8FF3E]">
                  Hook 94
                </span>
              </div>

              <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 text-center">
                <p className="text-[clamp(1.8rem,4.4vw,2.7rem)] leading-[0.92] font-bold tracking-[-0.045em] uppercase">
                  Nobody tells you
                  <br />
                  the first year is
                  <br />
                  <span className="relative inline-block">
                    <span className="relative z-10 px-1 text-black">the quiet one</span>
                    <span
                      className="absolute inset-0 z-0 skew-y-[-1.5deg] bg-[#D8FF3E]"
                      aria-hidden="true"
                    />
                  </span>
                </p>
              </div>

              <div className="absolute inset-x-5 bottom-5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#F4F2ED] text-black">
                    <PlayIcon className="ml-0.5 size-3.5 fill-current" aria-hidden="true" />
                  </span>
                  <div className="relative h-1 flex-1 bg-white/15">
                    <div className="absolute inset-y-0 left-0 w-[42%] bg-[#D8FF3E]" />
                    <span className="absolute top-1/2 left-[42%] size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F4F2ED]" />
                  </div>
                  <span className="font-mono text-[7px] text-[#8A867E]">0:13</span>
                </div>
                <div className="mt-3 flex items-center justify-between font-mono text-[7px] tracking-[0.1em] text-[#5C5953] uppercase">
                  <span>9:16 · 30 fps</span>
                  <span>Sample, not a live render</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Passes */}
        <section id="passes" className="border-y border-white/10">
          <div className="mx-auto w-full max-w-[1320px] px-5 py-16 sm:px-8 lg:py-24">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="max-w-[15ch] text-[clamp(2rem,4vw,3.3rem)] leading-[0.96] font-bold tracking-[-0.05em] uppercase">
                Three passes.
                <br />
                <span className="text-[#8A867E]">One clip.</span>
              </h2>
              <p className="max-w-[22rem] text-[12px] leading-relaxed text-[#8A867E]">
                No timer-based slicing. Each pass is a real step in the pipeline, with a real state
                you can watch.
              </p>
            </div>

            <div className="grid gap-px bg-white/10 sm:grid-cols-3">
              {[
                {
                  n: "01",
                  title: "Read",
                  body: "Word-level transcription with timestamps. The sentence is the unit, not the scene.",
                },
                {
                  n: "02",
                  title: "Choose",
                  body: "Hooks are scored and bounded. Every cut shows its start, end, and reasoning.",
                },
                {
                  n: "03",
                  title: "Burn",
                  body: "9:16 crop, ASS captions, thumbnail, H.264 file. Download it or retry the render.",
                },
              ].map((pass) => (
                <div key={pass.n} className="bg-black p-6">
                  <span className="font-mono text-[10px] tracking-[0.12em] text-[#D8FF3E]">
                    {pass.n}
                  </span>
                  <h3 className="mt-8 text-[22px] font-semibold tracking-[-0.03em] uppercase">
                    {pass.title}
                  </h3>
                  <p className="mt-2 text-[12px] leading-relaxed text-[#8A867E]">{pass.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Moments */}
        <section id="moments" className="mx-auto w-full max-w-[1320px] px-5 py-16 sm:px-8 lg:py-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] leading-none font-bold tracking-[-0.05em] uppercase">
              The moment
              <span className="text-[#D8FF3E]">.</span>
            </h2>
            <p className="max-w-[21rem] text-[11px] leading-relaxed text-[#8A867E]">
              Three sample hooks from one recording. Labelled sample, because the studio never
              invents a result.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {MOMENTS.map((moment) => (
              <figure key={moment.time} className="group border border-white/10 bg-[#070707] p-3">
                <div className="relative aspect-[4/5] overflow-hidden bg-[linear-gradient(160deg,#1B1B18,#080808_70%)]">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(216,255,62,0.10),transparent_62%)]" />
                  <span className="absolute top-2 left-2 font-mono text-[7px] tracking-[0.1em] text-[#8A867E] uppercase">
                    Sample
                  </span>
                  <p className="absolute inset-x-3 top-1/2 -translate-y-1/2 text-center text-[clamp(1rem,1.6vw,1.35rem)] leading-[1.05] font-bold tracking-[-0.02em] uppercase">
                    {moment.quote}
                  </p>
                  <span className="absolute right-2 bottom-2 bg-[#D8FF3E] px-1.5 py-0.5 font-mono text-[8px] font-semibold text-black">
                    {moment.score}
                  </span>
                </div>
                <figcaption className="mt-3">
                  <p className="text-[11px] leading-relaxed text-[#8A867E]">{moment.hook}</p>
                  <div className="mt-2 flex items-center justify-between font-mono text-[7px] tracking-[0.1em] text-[#5C5953] uppercase">
                    <span>{moment.time}</span>
                    <span className="transition-colors group-hover:text-[#D8FF3E]">9:16</span>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Price */}
        <section id="price" className="border-t border-white/10">
          <div className="mx-auto grid w-full max-w-[1320px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-24">
            <div>
              <h2 className="max-w-[11ch] text-[clamp(2rem,4vw,3.2rem)] leading-[0.96] font-bold tracking-[-0.05em] uppercase">
                Pay for
                <br />
                source,
                <br />
                <span className="text-[#D8FF3E]">not renders.</span>
              </h2>
              <p className="mt-5 max-w-[24rem] text-[13px] leading-relaxed text-[#8A867E]">
                One credit is one minute of video, rounded up. A failed job refunds it. Billing is
                not live in this preview.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-white/12 p-5">
                <p className="font-mono text-[9px] tracking-[0.12em] text-[#8A867E] uppercase">
                  Free
                </p>
                <p className="mt-4 text-[2.6rem] leading-none font-bold tracking-[-0.055em]">$0</p>
                <p className="mt-2 text-[11px] text-[#8A867E]">30 credits a month</p>
                <ul className="mt-6 space-y-2 text-[12px] text-[#C9C5BD]">
                  {["One 15-minute source", "5 vertical cuts", "Burned captions"].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 size-3 text-[#D8FF3E]" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="mt-7 inline-flex h-10 w-full items-center justify-center border border-white/15 text-[12px] text-[#F4F2ED] transition-colors hover:border-[#D8FF3E] hover:text-[#D8FF3E]"
                >
                  Start free
                </Link>
              </div>

              <div className="border border-[#D8FF3E]/60 bg-[#D8FF3E]/[0.04] p-5">
                <p className="font-mono text-[9px] tracking-[0.12em] text-[#D8FF3E] uppercase">
                  Starter
                </p>
                <p className="mt-4 text-[2.6rem] leading-none font-bold tracking-[-0.055em]">$19</p>
                <p className="mt-2 text-[11px] text-[#8A867E]">₹1,499 · 150 credits a month</p>
                <ul className="mt-6 space-y-2 text-[12px] text-[#C9C5BD]">
                  {["Ten 15-minute sources", "Priority rendering", "Full credit ledger"].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 size-3 text-[#D8FF3E]" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="mt-7 inline-flex h-10 w-full items-center justify-center gap-1.5 bg-[#D8FF3E] text-[12px] font-semibold text-black transition-[filter,transform] hover:brightness-105 active:scale-[0.99]"
                >
                  Choose Starter
                  <ArrowRightIcon className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/10">
          <div className="mx-auto w-full max-w-[1320px] px-5 py-16 sm:px-8 lg:py-24">
            <p className="max-w-[14ch] text-[clamp(2.4rem,7vw,5.6rem)] leading-[0.86] font-bold tracking-[-0.06em] uppercase">
              Make the
              <br />
              first second
              <br />
              <span className="text-[#D8FF3E]">count.</span>
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex h-12 items-center gap-2 bg-[#F4F2ED] px-6 text-[13px] font-semibold text-black transition-[filter,transform] hover:brightness-95 active:scale-[0.99]"
            >
              Cut your first clip
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-2 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-mono text-[8px] tracking-[0.12em] text-[#5C5953] uppercase">
            © 2026 ClipMax · Hook Machine concept
          </span>
          <span className="font-mono text-[8px] tracking-[0.12em] text-[#5C5953] uppercase">
            Sample moments are labelled · no invented results
          </span>
        </div>
      </footer>
    </div>
  );
}
