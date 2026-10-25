import { ArrowRightIcon, CheckIcon, ScissorsIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ClipMaxMark } from "@/components/brand/clipmax-mark";
import { LabNav } from "../../../components/lab-nav";

export const metadata: Metadata = {
  title: "Cutting Room · Design lab",
  description:
    "A warm, cinematic ClipMax landing page: a lamplit edit bay where one long recording becomes a week of vertical cuts.",
};

const SAMPLE_CUTS = [
  {
    time: "00:12:40",
    quote: "Nobody tells you the first year is the quiet one.",
    score: "94",
    tone: "from-[#3A2617] via-[#1B120B] to-[#0B0908]",
  },
  {
    time: "00:26:18",
    quote: "I almost quit in month nine. Then one clip changed the year.",
    score: "91",
    tone: "from-[#2C2418] via-[#17130D] to-[#0B0908]",
  },
  {
    time: "00:38:02",
    quote: "You do not need more ideas. You need the nerve to cut.",
    score: "89",
    tone: "from-[#33201A] via-[#1A100C] to-[#0B0908]",
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Find the moment",
    body: "The transcript is read the way an editor reads it: who is talking, where the turn lands, which sentence makes you stop.",
  },
  {
    n: "02",
    title: "Cut on the beat",
    body: "Every clip is bounded by speech, not by a timer. Hooks are labelled. The reasoning is shown, so you can disagree with it.",
  },
  {
    n: "03",
    title: "Frame and burn",
    body: "Horizontal master becomes 1080 × 1920, captions burned word by word, a thumbnail chosen, a file ready to post.",
  },
] as const;

export default function CuttingRoomPage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-[#0B0908] text-[#F3EBDD]">
      <LabNav active="cutting-room" />

      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_0%,rgba(255,162,75,0.10),transparent_65%)]" />
        <div className="absolute inset-0 film-grain opacity-[0.035] mix-blend-overlay" />
      </div>

      <header className="relative z-20 border-b border-[#2A2118]">
        <div className="mx-auto flex h-[72px] w-full max-w-[1320px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="ClipMax home">
            <ClipMaxMark className="size-7 text-[#FFA24B]" />
            <span className="text-[17px] font-semibold tracking-[-0.03em]">ClipMax</span>
            <span className="hidden h-3 w-px bg-[#3A2E22] sm:block" />
            <span className="hidden font-mono text-[8px] tracking-[0.16em] text-[#8C7A66] uppercase sm:block">
              Cutting room
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-[12px] text-[#B6A691] md:flex">
            <a href="#workflow" className="transition-colors hover:text-[#F3EBDD]">
              Workflow
            </a>
            <a href="#cuts" className="transition-colors hover:text-[#F3EBDD]">
              Sample cuts
            </a>
            <a href="#pricing" className="transition-colors hover:text-[#F3EBDD]">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/signup"
              className="hidden h-9 items-center px-3 text-[12px] text-[#B6A691] transition-colors hover:text-[#F3EBDD] sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center gap-1.5 bg-[#F3EBDD] px-4 text-[12px] font-semibold text-[#0B0908] transition-[filter,transform] hover:brightness-95 active:scale-[0.99]"
            >
              Start free
              <ArrowRightIcon className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-[1320px] gap-12 px-5 pt-12 pb-16 sm:px-8 sm:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-10 lg:pt-20 lg:pb-24">
          <div>
            <p className="flex items-center gap-2 text-[11px] text-[#B6A691]">
              <span className="size-1.5 rounded-full bg-[#FFA24B]" aria-hidden="true" />
              An AI cutting room for long recordings
            </p>

            <h1 className="mt-5 max-w-[15ch] text-[clamp(2.6rem,5.6vw,4.6rem)] leading-[0.92] font-semibold tracking-[-0.06em] text-balance">
              Long video in.
              <br />
              A <span className="font-serif text-[1.07em] font-normal tracking-[-0.035em] text-[#FFA24B] italic">week</span>{" "}
              of clips out.
            </h1>

            <p className="mt-5 max-w-[31rem] text-[15px] leading-relaxed text-pretty text-[#B6A691]">
              One conversation becomes five vertical cuts: hooks found, the speaker framed, the words
              burned in. Review them before your coffee goes cold.
            </p>

            <div className="mt-7 max-w-[34rem] border border-[#3A2E22] bg-[#120E0A]/80 p-2 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]">
              <div className="flex items-center gap-1 border-b border-[#2A2118] px-2 pb-2">
                <span className="bg-[#241B13] px-2.5 py-1 text-[10px] text-[#F3EBDD]">Paste a link</span>
                <span className="px-2.5 py-1 text-[10px] text-[#8C7A66]">Upload a file</span>
              </div>
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <div className="flex h-11 min-w-0 flex-1 items-center border border-[#3A2E22] bg-[#0B0908] px-3">
                  <span className="truncate font-mono text-[11px] text-[#8C7A66]">
                    youtube.com/watch?v=…
                  </span>
                </div>
                <Link
                  href="/signup"
                  className="inline-flex h-11 items-center justify-center gap-1.5 bg-[#FFA24B] px-5 text-[12px] font-semibold text-[#1B1006] transition-[filter,transform] hover:brightness-105 active:scale-[0.99]"
                >
                  Find the hooks
                  <ScissorsIcon className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
              <p className="px-1 pt-2 text-[10px] text-[#8C7A66]">
                15 minutes · 500 MB · MP4, MOV, WebM. Public links supported.
              </p>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[#B6A691]">
              {["Word-level captions", "9:16 framing", "Real rendered files"].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <CheckIcon className="size-3 text-[#FFA24B]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Monitor */}
          <div className="relative">
            <div className="relative overflow-hidden border border-[#3A2E22] bg-[#0E0B08] p-3 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.95)]">
              <div className="flex items-center justify-between pb-2">
                <span className="font-mono text-[8px] tracking-[0.14em] text-[#8C7A66] uppercase">
                  Source · 00:42:17
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[8px] tracking-[0.12em] text-[#FFA24B] uppercase">
                  <span className="size-1 rounded-full bg-[#FFA24B]" aria-hidden="true" />
                  Rec
                </span>
              </div>

              <div className="relative aspect-video overflow-hidden bg-[linear-gradient(150deg,#33200F,#1A1009_52%,#0B0908)]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_28%_18%,rgba(255,162,75,0.30),transparent_58%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_80%,rgba(155,231,255,0.08),transparent_60%)]" />

                <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 text-center">
                  <p className="mx-auto max-w-[17ch] text-[clamp(1.05rem,2vw,1.5rem)] leading-[1.1] font-semibold tracking-[-0.03em] text-[#F3EBDD] uppercase">
                    The first year is the{" "}
                    <span className="bg-[#FFA24B] px-1 text-[#1B1006]">quiet one</span>
                  </p>
                </div>

                <div className="absolute inset-x-3 bottom-2 flex items-end justify-between gap-3">
                  <div className="flex h-6 items-end gap-[2px]">
                    {[18, 34, 22, 48, 30, 52, 26, 40, 20, 44, 32, 56, 24, 38, 28, 46, 22, 36].map(
                      (height, index) => (
                        <span
                          key={index}
                          className="w-[3px] bg-[#FFA24B]/70"
                          style={{ height: `${height}%` }}
                        />
                      ),
                    )}
                  </div>
                  <span className="font-mono text-[7px] tracking-[0.14em] text-[#8C7A66]">
                    16:9 master
                  </span>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-[7px] tracking-[0.12em] text-[#5E5040] uppercase">
                  00:00:00:00
                </span>
                <span className="font-mono text-[7px] tracking-[0.12em] text-[#8C7A66] uppercase">
                  Sample frame, not a live render
                </span>
              </div>
            </div>

            {/* Floating vertical cuts */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {SAMPLE_CUTS.map((cut, index) => (
                <div
                  key={cut.time}
                  className={`relative aspect-[9/16] overflow-hidden border border-[#3A2E22] bg-gradient-to-b ${cut.tone}`}
                  style={{ marginTop: index === 1 ? 14 : index === 2 ? 4 : 0 }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(255,162,75,0.22),transparent_62%)]" />
                  <span className="absolute top-1.5 left-1.5 font-mono text-[6px] tracking-[0.1em] text-[#FFA24B] uppercase">
                    {index === 0 ? "Hook" : index === 1 ? "Turn" : "Payoff"}
                  </span>
                  <p className="absolute inset-x-1.5 top-1/2 -translate-y-1/2 text-center text-[9px] leading-[1.25] font-semibold text-[#F3EBDD] uppercase">
                    {cut.quote}
                  </p>
                  <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between font-mono text-[6px] text-[#B6A691]">
                    <span>{cut.time}</span>
                    <span className="text-[#9BE7FF]">{cut.score}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-right font-mono text-[7px] tracking-[0.12em] text-[#5E5040] uppercase">
              5 cuts · 9:16 · 1080 × 1920
            </p>
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" className="border-t border-[#2A2118]">
          <div className="mx-auto w-full max-w-[1320px] px-5 py-16 sm:px-8 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div>
                <p className="font-mono text-[9px] tracking-[0.16em] text-[#8C7A66] uppercase">
                  The work
                </p>
                <h2 className="mt-3 max-w-[13ch] text-[clamp(2rem,3.6vw,3.1rem)] leading-[0.98] font-semibold tracking-[-0.055em]">
                  The cut is the{" "}
                  <span className="font-serif font-normal tracking-[-0.03em] text-[#FFA24B] italic">
                    product.
                  </span>
                </h2>
                <p className="mt-4 max-w-[25rem] text-[14px] leading-relaxed text-[#B6A691]">
                  Not a highlight reel with a score slapped on it. A transcript read for turns, a
                  boundary you can inspect, and a frame that respects the speaker.
                </p>
              </div>

              <ol className="divide-y divide-[#2A2118] border-y border-[#2A2118]">
                {STEPS.map((step) => (
                  <li key={step.n} className="grid gap-3 py-6 sm:grid-cols-[48px_1fr] sm:gap-6">
                    <span className="font-mono text-[10px] tracking-[0.12em] text-[#FFA24B]">
                      {step.n}
                    </span>
                    <div>
                      <h3 className="text-[16px] font-medium tracking-[-0.02em]">{step.title}</h3>
                      <p className="mt-1.5 max-w-[34rem] text-[13px] leading-relaxed text-[#B6A691]">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Sample cuts */}
        <section id="cuts" className="border-t border-[#2A2118]">
          <div className="mx-auto w-full max-w-[1320px] px-5 py-16 sm:px-8 lg:py-24">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-[9px] tracking-[0.16em] text-[#8C7A66] uppercase">
                  Sample cuts
                </p>
                <h2 className="mt-3 text-[clamp(2rem,3.6vw,3.1rem)] leading-[0.98] font-semibold tracking-[-0.055em]">
                  What leaves the room.
                </h2>
              </div>
              <p className="max-w-[20rem] text-[11px] leading-relaxed text-[#8C7A66]">
                Every frame below is sample content, labelled as sample. The studio runs on your
                file or not at all.
              </p>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {SAMPLE_CUTS.map((cut) => (
                <figure key={cut.time} className="group">
                  <div
                    className={`relative aspect-[9/16] overflow-hidden border border-[#3A2E22] bg-gradient-to-b ${cut.tone}`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(255,162,75,0.24),transparent_62%)]" />
                    <span className="absolute top-2 left-2 border border-[#FFA24B]/40 px-1.5 py-0.5 font-mono text-[6px] tracking-[0.12em] text-[#FFA24B] uppercase">
                      Sample
                    </span>
                    <p className="absolute inset-x-3 top-1/2 -translate-y-1/2 text-center text-[13px] leading-[1.22] font-semibold tracking-[-0.01em] text-[#F3EBDD] uppercase">
                      {cut.quote}
                    </p>
                    <div className="absolute inset-x-2 bottom-2 flex items-center justify-between">
                      <span className="font-mono text-[7px] text-[#B6A691]">{cut.time}</span>
                      <span className="bg-[#0B0908]/70 px-1.5 py-0.5 font-mono text-[7px] text-[#9BE7FF]">
                        {cut.score}/100
                      </span>
                    </div>
                  </div>
                  <figcaption className="mt-2 flex items-center justify-between text-[11px] text-[#8C7A66]">
                    <span>Vertical cut · burned captions</span>
                    <span className="transition-colors group-hover:text-[#FFA24B]">9:16</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-[#2A2118]">
          <div className="mx-auto w-full max-w-[1320px] px-5 py-16 sm:px-8 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div>
                <p className="font-mono text-[9px] tracking-[0.16em] text-[#8C7A66] uppercase">
                  The rate
                </p>
                <h2 className="mt-3 max-w-[12ch] text-[clamp(2rem,3.6vw,3.1rem)] leading-[0.98] font-semibold tracking-[-0.055em]">
                  One credit, one{" "}
                  <span className="font-serif font-normal tracking-[-0.03em] text-[#FFA24B] italic">
                    minute.
                  </span>
                </h2>
                <p className="mt-4 max-w-[25rem] text-[14px] leading-relaxed text-[#B6A691]">
                  Credits are spent on the source length, rounded up, never on renders. A failed job
                  refunds itself. Payments are not live in this preview.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col border border-[#3A2E22] p-5">
                  <p className="text-[11px] text-[#8C7A66]">Free</p>
                  <p className="mt-3 text-[2.2rem] leading-none font-semibold tracking-[-0.05em]">
                    $0
                  </p>
                  <p className="mt-1 text-[11px] text-[#8C7A66]">30 credits a month, no card</p>
                  <ul className="mt-5 flex-1 space-y-2 text-[12px] text-[#B6A691]">
                    {["One 15-minute source", "5 vertical cuts", "Burned captions"].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckIcon className="mt-0.5 size-3 shrink-0 text-[#FFA24B]" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className="mt-6 inline-flex h-10 items-center justify-center border border-[#3A2E22] text-[12px] text-[#F3EBDD] transition-colors hover:border-[#FFA24B] hover:text-[#FFA24B]"
                  >
                    Start free
                  </Link>
                </div>

                <div className="flex flex-col border border-[#FFA24B]/60 bg-[#120E0A] p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-[#FFA24B]">Starter</p>
                    <span className="font-mono text-[7px] tracking-[0.12em] text-[#8C7A66] uppercase">
                      Monthly
                    </span>
                  </div>
                  <p className="mt-3 text-[2.2rem] leading-none font-semibold tracking-[-0.05em]">
                    $19
                  </p>
                  <p className="mt-1 text-[11px] text-[#8C7A66]">₹1,499 · 150 credits a month</p>
                  <ul className="mt-5 flex-1 space-y-2 text-[12px] text-[#B6A691]">
                    {["Ten 15-minute sources", "Priority rendering", "Full credit ledger"].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckIcon className="mt-0.5 size-3 shrink-0 text-[#FFA24B]" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className="mt-6 inline-flex h-10 items-center justify-center gap-1.5 bg-[#FFA24B] text-[12px] font-semibold text-[#1B1006] transition-[filter,transform] hover:brightness-105 active:scale-[0.99]"
                  >
                    Choose Starter
                    <ArrowRightIcon className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-[#2A2118]">
          <div className="mx-auto w-full max-w-[1320px] px-5 py-16 sm:px-8 lg:py-24">
            <div className="relative overflow-hidden border border-[#3A2E22] bg-[#120E0A] px-6 py-12 sm:px-10 lg:px-14">
              <div
                className="pointer-events-none absolute -top-24 right-0 size-[420px] rounded-full bg-[#FFA24B]/12 blur-[90px]"
                aria-hidden="true"
              />
              <p className="relative font-mono text-[9px] tracking-[0.16em] text-[#8C7A66] uppercase">
                The long version is where the good part is
              </p>
              <div className="relative mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <h2 className="max-w-[18ch] text-[clamp(2rem,4vw,3.4rem)] leading-[0.96] font-semibold tracking-[-0.055em]">
                  Bring the{" "}
                  <span className="font-serif font-normal tracking-[-0.03em] text-[#FFA24B] italic">
                    long version.
                  </span>
                  <br />
                  Leave with the week.
                </h2>
                <Link
                  href="/signup"
                  className="inline-flex h-11 shrink-0 items-center gap-2 bg-[#F3EBDD] px-5 text-[12px] font-semibold text-[#0B0908] transition-[filter,transform] hover:brightness-95 active:scale-[0.99]"
                >
                  Open the cutting room
                  <ArrowRightIcon className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[#2A2118]">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-2 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2">
            <ClipMaxMark className="size-4 text-[#8C7A66]" />
            <span className="font-mono text-[8px] tracking-[0.14em] text-[#5E5040] uppercase">
              © 2026 ClipMax · Cutting room concept
            </span>
          </div>
          <p className="font-mono text-[8px] tracking-[0.14em] text-[#5E5040] uppercase">
            Sample cuts are labelled · the studio runs on real data
          </p>
        </div>
      </footer>
    </div>
  );
}
