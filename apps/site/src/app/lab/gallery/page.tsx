import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ClipMaxMark } from "@/components/brand/clipmax-mark";
import { LabNav } from "../../../components/lab-nav";

export const metadata: Metadata = {
  title: "Gallery · Design lab",
  description:
    "A quiet, museum-like ClipMax landing page where the vertical cuts are the entire composition.",
};

const WALL = [
  { quote: "I stopped guessing", tone: "from-[#3A3630] to-[#141312]", offset: "mt-0", time: "0:18" },
  { quote: "the quiet year", tone: "from-[#4A4238] to-[#161514]", offset: "mt-10", time: "0:24" },
  {
    quote: "ask better questions",
    tone: "from-[#2E3136] to-[#111214]",
    offset: "mt-3",
    time: "0:30",
  },
  {
    quote: "ship the small thing",
    tone: "from-[#3D332C] to-[#131211]",
    offset: "mt-14",
    time: "0:36",
  },
  { quote: "taste is a skill", tone: "from-[#33322E] to-[#121212]", offset: "mt-6", time: "0:42" },
] as const;

const ROOM = [
  {
    number: "01",
    title: "The hook",
    time: "00:12:40 — 00:13:11",
    body: "The sentence that makes a stranger stop. Bounded on a breath, captioned at the first frame.",
    quote: "Nobody tells you the first year is the quiet one.",
    tone: "from-[#3B3225] via-[#1A1611] to-[#0D0D0E]",
  },
  {
    number: "02",
    title: "The turn",
    time: "00:26:18 — 00:26:54",
    body: "The moment the argument changes direction. The cut keeps the pause before it.",
    quote: "I almost quit in month nine.",
    tone: "from-[#2F302B] via-[#151613] to-[#0D0D0E]",
  },
  {
    number: "03",
    title: "The payoff",
    time: "00:38:02 — 00:38:39",
    body: "The line worth repeating at dinner. Framed, captioned, and exported without a timeline.",
    quote: "You need the nerve to cut.",
    tone: "from-[#3A2B26] via-[#191311] to-[#0D0D0E]",
  },
] as const;

export default function GalleryPage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-[#0D0D0E] text-[#EDE7DB]">
      <LabNav active="gallery" />

      <header className="relative z-20">
        <div className="mx-auto flex h-[84px] w-full max-w-[1360px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="ClipMax home">
            <ClipMaxMark className="size-7 text-[#EDE7DB]" />
            <span className="text-[17px] font-medium tracking-[-0.03em]">ClipMax</span>
          </Link>

          <nav className="hidden items-center gap-8 text-[12px] text-[#A29B90] md:flex">
            <a href="#room" className="transition-colors hover:text-[#EDE7DB]">
              Room 01
            </a>
            <a href="#method" className="transition-colors hover:text-[#EDE7DB]">
              Method
            </a>
            <a href="#admission" className="transition-colors hover:text-[#EDE7DB]">
              Admission
            </a>
          </nav>

          <Link
            href="/signup"
            className="inline-flex h-9 items-center gap-1.5 border border-[#EDE7DB]/35 px-4 text-[12px] text-[#EDE7DB] transition-colors hover:border-[#EDE7DB] hover:bg-[#EDE7DB] hover:text-[#0D0D0E]"
          >
            Enter the studio
            <ArrowRightIcon className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative mx-auto w-full max-w-[1360px] px-5 pt-10 pb-16 sm:px-8 sm:pt-16">
          <div className="flex items-center justify-between border-b border-[#EDE7DB]/15 pb-3">
            <span className="font-mono text-[8px] tracking-[0.16em] text-[#A29B90] uppercase">
              Selected cuts · Autumn 2026
            </span>
            <span className="font-mono text-[8px] tracking-[0.16em] text-[#5F5A52] uppercase">
              Room 01
            </span>
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <h1 className="max-w-[12ch] text-[clamp(2.8rem,7vw,5.6rem)] leading-[0.85] font-normal tracking-[-0.07em] text-balance">
                The moment,
                <br />
                <span className="font-serif italic tracking-[-0.04em]">framed.</span>
              </h1>
              <p className="mt-6 max-w-[27rem] text-[14px] leading-relaxed text-pretty text-[#A29B90]">
                One recording, five frames worth keeping. ClipMax finds the sentence, crops the
                speaker, burns the words, and leaves the rest on the cutting-room floor.
              </p>

              <div className="mt-7 flex max-w-[28rem] flex-col gap-2 border-t border-[#EDE7DB]/15 pt-4 sm:flex-row">
                <div className="flex h-10 min-w-0 flex-1 items-center border-b border-[#EDE7DB]/25">
                  <span className="truncate font-mono text-[10px] text-[#5F5A52]">
                    paste a public video link
                  </span>
                </div>
                <Link
                  href="/signup"
                  className="inline-flex h-10 items-center justify-center gap-1.5 bg-[#EDE7DB] px-4 text-[11px] font-medium text-[#0D0D0E] transition-[filter,transform] hover:brightness-95 active:scale-[0.99]"
                >
                  Begin
                  <ArrowRightIcon className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
              <p className="mt-2 font-mono text-[8px] tracking-[0.1em] text-[#5F5A52] uppercase">
                15 min · 500 MB · 1080 × 1920
              </p>
            </div>

            <div className="relative h-[300px] overflow-hidden sm:h-[380px] lg:h-[440px]">
              <div className="absolute inset-x-0 top-0 flex items-start justify-center gap-2 sm:gap-3">
                {WALL.map((frame) => (
                  <div
                    key={frame.quote}
                    className={`relative aspect-[9/16] w-[17%] shrink-0 overflow-hidden rounded-[2px] border border-white/10 bg-gradient-to-b ${frame.tone} ${frame.offset}`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(255,255,255,0.16),transparent_60%)]" />
                    <p className="absolute inset-x-1.5 top-1/2 -translate-y-1/2 text-center text-[7px] leading-[1.3] font-medium tracking-[-0.01em] text-[#EDE7DB] uppercase">
                      {frame.quote}
                    </p>
                    <span className="absolute right-1 bottom-1 font-mono text-[6px] text-[#A29B90]">
                      {frame.time}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0D0D0E] to-transparent" />
              <p className="absolute right-0 bottom-0 font-mono text-[7px] tracking-[0.12em] text-[#5F5A52] uppercase">
                Sample cuts, not a live project
              </p>
            </div>
          </div>
        </section>

        {/* Room */}
        <section id="room" className="border-t border-[#EDE7DB]/15">
          <div className="mx-auto w-full max-w-[1360px] px-5 py-16 sm:px-8 lg:py-24">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="font-mono text-[8px] tracking-[0.16em] text-[#5F5A52] uppercase">
                  Room 01
                </span>
                <h2 className="mt-3 text-[clamp(1.9rem,3.6vw,3rem)] leading-none font-normal tracking-[-0.05em]">
                  Three cuts from one conversation.
                </h2>
              </div>
              <p className="max-w-[20rem] text-[11px] leading-relaxed text-[#A29B90]">
                Each frame is a real output shape: 1080 × 1920, H.264, burned word-level captions,
                centre crop.
              </p>
            </div>

            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {ROOM.map((piece) => (
                <article key={piece.number}>
                  <div
                    className={`relative aspect-[9/16] overflow-hidden bg-gradient-to-b ${piece.tone}`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_22%,rgba(255,255,255,0.12),transparent_60%)]" />
                    <span className="absolute top-3 left-3 font-mono text-[7px] tracking-[0.12em] text-[#A29B90] uppercase">
                      {piece.number}
                    </span>
                    <p className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center text-[clamp(0.95rem,1.5vw,1.2rem)] leading-[1.15] font-medium tracking-[-0.01em] text-[#EDE7DB]">
                      “{piece.quote}”
                    </p>
                    <span className="absolute right-3 bottom-3 font-mono text-[7px] tracking-[0.1em] text-[#A29B90]">
                      {piece.time}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[16px] font-medium tracking-[-0.02em]">{piece.title}</h3>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[#A29B90]">{piece.body}</p>
                  <p className="mt-2 font-mono text-[7px] tracking-[0.12em] text-[#5F5A52] uppercase">
                    Sample · rendered from a 42:17 source
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Method */}
        <section id="method" className="border-y border-[#EDE7DB]/15 bg-[#0B0B0C]">
          <div className="mx-auto grid w-full max-w-[1360px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.42fr_0.58fr] lg:gap-16 lg:py-24">
            <div>
              <span className="font-mono text-[8px] tracking-[0.16em] text-[#5F5A52] uppercase">
                Method
              </span>
              <h2 className="mt-3 max-w-[13ch] text-[clamp(1.9rem,3.4vw,2.9rem)] leading-[1] font-normal tracking-[-0.05em]">
                The wall is built from <span className="font-serif italic">decisions.</span>
              </h2>
              <p className="mt-5 max-w-[23rem] text-[13px] leading-relaxed text-[#A29B90]">
                A clip is not a crop of a random 30 seconds. It is a boundary, a reason, and a frame.
                The studio shows all three before you download.
              </p>
            </div>

            <div className="divide-y divide-[#EDE7DB]/12 border-y border-[#EDE7DB]/12">
              {[
                {
                  title: "Read the transcript",
                  body: "Word-level timestamps, speaker turns, and the sentence that carries the change.",
                },
                {
                  title: "Bound the moment",
                  body: "Start and end snap to speech, not to a fixed duration. The hook is written from the line.",
                },
                {
                  title: "Frame and burn",
                  body: "A 9:16 crop, ASS captions, a thumbnail, and a real file in a private bucket.",
                },
              ].map((item, index) => (
                <div key={item.title} className="grid gap-2 py-5 sm:grid-cols-[40px_1fr] sm:gap-5">
                  <span className="font-mono text-[9px] tracking-[0.12em] text-[#5F5A52]">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="text-[14px] font-medium tracking-[-0.01em]">{item.title}</h3>
                    <p className="mt-1 max-w-[32rem] text-[12px] leading-relaxed text-[#A29B90]">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Admission */}
        <section id="admission" className="mx-auto w-full max-w-[1360px] px-5 py-16 sm:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:gap-16">
            <div>
              <span className="font-mono text-[8px] tracking-[0.16em] text-[#5F5A52] uppercase">
                Admission
              </span>
              <h2 className="mt-3 max-w-[10ch] text-[clamp(1.9rem,3.4vw,2.9rem)] leading-[1] font-normal tracking-[-0.05em]">
                Priced by the <span className="font-serif italic">minute.</span>
              </h2>
              <p className="mt-5 max-w-[22rem] text-[13px] leading-relaxed text-[#A29B90]">
                One credit is one minute of source. Renders are included. Failed jobs refund. Billing
                is not live in this preview.
              </p>
            </div>

            <div className="border-t border-[#EDE7DB]/20">
              {[
                {
                  name: "Free",
                  price: "$0",
                  note: "30 credits a month · no card",
                  action: "Enter free",
                  lead: false,
                },
                {
                  name: "Starter",
                  price: "$19",
                  note: "₹1,499 a month · 150 credits",
                  action: "Choose Starter",
                  lead: true,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className="flex flex-col gap-4 border-b border-[#EDE7DB]/15 py-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-serif text-[24px] leading-none">{plan.name}</h3>
                    <p className="mt-2 text-[12px] text-[#A29B90]">{plan.note}</p>
                  </div>
                  <div className="flex items-center gap-5">
                    <span className="text-[24px] tracking-[-0.04em]">{plan.price}</span>
                    <Link
                      href="/signup"
                      className={`inline-flex h-9 items-center px-4 text-[11px] transition-colors ${
                        plan.lead
                          ? "bg-[#EDE7DB] font-medium text-[#0D0D0E] hover:brightness-95"
                          : "border border-[#EDE7DB]/30 text-[#EDE7DB] hover:border-[#EDE7DB]"
                      }`}
                    >
                      {plan.action}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-[#EDE7DB]/15">
          <div className="mx-auto w-full max-w-[1360px] px-5 py-16 sm:px-8 lg:py-24">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <p className="max-w-[16ch] text-[clamp(2.2rem,5.6vw,4.4rem)] leading-[0.9] font-normal tracking-[-0.06em]">
                Hang your own
                <br />
                <span className="font-serif italic">frames.</span>
              </p>
              <Link
                href="/signup"
                className="inline-flex h-11 shrink-0 items-center gap-2 bg-[#EDE7DB] px-5 text-[12px] font-medium text-[#0D0D0E] transition-[filter,transform] hover:brightness-95 active:scale-[0.99]"
              >
                Start with 30 credits
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#EDE7DB]/15">
        <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-2 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-mono text-[8px] tracking-[0.12em] text-[#5F5A52] uppercase">
            © 2026 ClipMax · Gallery concept
          </span>
          <span className="font-mono text-[8px] tracking-[0.12em] text-[#5F5A52] uppercase">
            Sample cuts are labelled · the studio runs on real data
          </span>
        </div>
      </footer>
    </div>
  );
}
