import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ClipMaxMark } from "@/components/brand/clipmax-mark";
import { LabNav } from "../../../components/lab-nav";

export const metadata: Metadata = {
  title: "Paper Edit · Design lab",
  description:
    "A print-inspired ClipMax landing page: cream stock, ink, a red marker, and a contact sheet of cuts.",
};

const CONTACT_SHEET = [
  {
    caption: "01 · The hook",
    quote: "Nobody tells you the first year is the quiet one.",
    tone: "bg-[#CDBFA9]",
  },
  {
    caption: "02 · The turn",
    quote: "I almost quit in month nine.",
    tone: "bg-[#B7A791]",
  },
  {
    caption: "03 · The payoff",
    quote: "Then one clip changed the year.",
    tone: "bg-[#9C8B75]",
  },
  {
    caption: "04 · The close",
    quote: "You need the nerve to cut.",
    tone: "bg-[#C6B69E]",
  },
] as const;

const RATES = [
  {
    name: "Free",
    price: "$0",
    note: "30 credits a month. No card.",
    includes: "One 15-minute source · 5 cuts · burned captions",
    cta: "Start free",
    lead: false,
  },
  {
    name: "Starter",
    price: "$19",
    note: "₹1,499 a month. 150 credits.",
    includes: "Ten 15-minute sources · priority render · full ledger",
    cta: "Choose Starter",
    lead: true,
  },
] as const;

function Frame({ tone, quote, caption }: { tone: string; quote: string; caption: string }) {
  return (
    <figure>
      <div className={`relative aspect-[3/4] overflow-hidden border border-[#141210]/25 ${tone}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_22%,rgba(255,255,255,0.34),transparent_62%)]" />
        <span className="absolute top-1.5 left-1.5 border border-[#141210]/35 px-1 py-0.5 font-mono text-[6px] tracking-[0.1em] text-[#141210] uppercase">
          Sample
        </span>
        <p className="absolute inset-x-2 top-1/2 -translate-y-1/2 text-center font-serif text-[13px] leading-[1.15] text-[#141210] italic">
          “{quote}”
        </p>
      </div>
      <figcaption className="mt-1.5 font-mono text-[7px] tracking-[0.1em] text-[#6B6257] uppercase">
        {caption}
      </figcaption>
    </figure>
  );
}

export default function PaperEditPage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-[#F3EEE4] text-[#141210]">
      <LabNav active="paper-edit" />

      <header className="border-b border-[#141210]/30">
        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
          <div className="flex items-center justify-between border-b border-[#141210]/15 py-2">
            <p className="font-mono text-[8px] tracking-[0.14em] text-[#6B6257] uppercase">
              The Cut · Issue 01 · October 2026
            </p>
            <p className="hidden font-mono text-[8px] tracking-[0.14em] text-[#6B6257] uppercase sm:block">
              Long video, short form
            </p>
          </div>

          <div className="flex h-[76px] items-center justify-between gap-4">
            <Link href="/" className="flex items-baseline gap-3" aria-label="ClipMax home">
              <ClipMaxMark className="size-7 text-[#141210]" />
              <span className="font-serif text-[30px] leading-none tracking-[-0.04em]">ClipMax</span>
              <span className="hidden font-mono text-[8px] tracking-[0.16em] text-[#6B6257] uppercase sm:block">
                The Cut
              </span>
            </Link>

            <nav className="hidden items-center gap-6 text-[12px] text-[#3A342C] md:flex">
              <a href="#argument" className="transition-colors hover:text-[#E2402C]">
                The argument
              </a>
              <a href="#sheet" className="transition-colors hover:text-[#E2402C]">
                Contact sheet
              </a>
              <a href="#rates" className="transition-colors hover:text-[#E2402C]">
                Rate card
              </a>
            </nav>

            <Link
              href="/signup"
              className="inline-flex h-9 items-center gap-1.5 bg-[#141210] px-4 text-[11px] font-medium text-[#F3EEE4] transition-[filter,transform] hover:brightness-110 active:scale-[0.99]"
            >
              Start free
              <ArrowRightIcon className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto w-full max-w-[1240px] px-5 pt-10 pb-12 sm:px-8 sm:pt-14">
          <div className="grid gap-10 lg:grid-cols-[1.18fr_0.82fr] lg:gap-14">
            <div>
              <div className="flex items-center gap-3 border-b border-[#141210]/20 pb-3">
                <span className="font-mono text-[8px] tracking-[0.14em] text-[#6B6257] uppercase">
                  Vol. 1 / No. 1
                </span>
                <span className="h-px flex-1 bg-[#141210]/15" />
                <span className="font-mono text-[8px] tracking-[0.14em] text-[#E2402C] uppercase">
                  The launch issue
                </span>
              </div>

              <h1 className="mt-6 max-w-[19ch] text-[clamp(2.5rem,5.6vw,4.7rem)] leading-[0.92] font-normal tracking-[-0.045em] text-balance">
                Every good clip is an{" "}
                <span className="relative inline-block">
                  argument
                  <span
                    className="absolute -bottom-1 left-0 h-[6px] w-full -rotate-1 bg-[#E2402C]/85"
                    aria-hidden="true"
                  />
                </span>{" "}
                for the <span className="italic">moment.</span>
              </h1>

              <p className="mt-6 max-w-[36rem] text-[15px] leading-relaxed text-pretty text-[#3A342C]">
                ClipMax reads a long recording the way an editor does: who is talking, where the turn
                lands, which sentence makes a stranger stop scrolling. Then it does the unglamorous
                part: reframes the master, sets the words, exports the file.
              </p>

              <div className="mt-8 flex max-w-[34rem] flex-col gap-3 border-t border-[#141210]/25 pt-4 sm:flex-row sm:items-end">
                <label className="min-w-0 flex-1">
                  <span className="font-mono text-[8px] tracking-[0.12em] text-[#6B6257] uppercase">
                    Paste a public video link
                  </span>
                  <span className="mt-2 flex h-10 items-center border-b border-[#141210]/40 pb-1">
                    <span className="truncate font-serif text-[15px] text-[#6B6257] italic">
                      youtube.com/watch?v=…
                    </span>
                  </span>
                </label>
                <Link
                  href="/signup"
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 bg-[#E2402C] px-5 text-[11px] font-semibold text-[#F3EEE4] transition-[filter,transform] hover:brightness-105 active:scale-[0.99]"
                >
                  Cut it
                  <ArrowRightIcon className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
              <p className="mt-2 font-mono text-[8px] tracking-[0.1em] text-[#6B6257] uppercase">
                15 min · 500 MB · MP4, MOV, WebM
              </p>
            </div>

            <div className="lg:pt-12">
              <div className="grid grid-cols-3 gap-2.5">
                <Frame {...CONTACT_SHEET[0]} />
                <div className="pt-6">
                  <Frame {...CONTACT_SHEET[1]} />
                </div>
                <Frame {...CONTACT_SHEET[2]} />
              </div>
              <div className="mt-4 border-t border-[#141210]/25 pt-3">
                <p className="font-serif text-[17px] leading-snug italic">
                  “The first year is the quiet one. Nobody tells you that.”
                </p>
                <div className="mt-2 flex items-center justify-between font-mono text-[8px] tracking-[0.1em] text-[#6B6257] uppercase">
                  <span>Hook line · 52 characters</span>
                  <span className="text-[#E2402C]">Scored 94</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Argument */}
        <section id="argument" className="border-y border-[#141210]/25 bg-[#EDE6D9]">
          <div className="mx-auto grid w-full max-w-[1240px] gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[0.34fr_0.66fr] lg:gap-14">
            <div>
              <p className="font-mono text-[8px] tracking-[0.14em] text-[#6B6257] uppercase">
                From the editor
              </p>
              <h2 className="mt-3 text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.02] font-normal tracking-[-0.035em]">
                We cut the scroll,
                <br />
                not the <span className="italic">story.</span>
              </h2>
              <p className="mt-4 max-w-[19rem] text-[12px] leading-relaxed text-[#6B6257]">
                A 45-minute conversation already contains a week of short-form work. The job is not
                to invent a moment. It is to find the one that was already there.
              </p>
            </div>

            <div className="grid gap-6 text-[13px] leading-[1.7] text-[#3A342C] sm:grid-cols-2">
              <p>
                <span className="float-left mt-1 mr-2 font-serif text-[46px] leading-[0.72]">T</span>
                he transcript is the first read. ClipMax looks for the sentence that changes the
                temperature of the room, then checks the boundary either side so the clip starts on a
                breath and ends on a thought.
              </p>
              <p>
                Nothing is hidden behind a magic button. Each cut carries its start, its end, its
                hook, and the reason it was chosen. If the reasoning is wrong, you can see exactly
                where, and cut it yourself.
              </p>
              <blockquote className="border-l-2 border-[#E2402C] pl-4 sm:col-span-2">
                <p className="font-serif text-[22px] leading-[1.18] italic">
                  “A clip is not a summary. It is the part of the conversation you would repeat at
                  dinner.”
                </p>
                <footer className="mt-2 font-mono text-[8px] tracking-[0.12em] text-[#6B6257] uppercase">
                  The ClipMax editing note
                </footer>
              </blockquote>
            </div>
          </div>
        </section>

        {/* Contact sheet */}
        <section id="sheet" className="mx-auto w-full max-w-[1240px] px-5 py-14 sm:px-8">
          <div className="flex flex-col gap-3 border-b border-[#141210]/25 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[8px] tracking-[0.14em] text-[#6B6257] uppercase">
                Contact sheet
              </p>
              <h2 className="mt-2 text-[clamp(1.8rem,3.4vw,2.7rem)] leading-none font-normal tracking-[-0.04em]">
                Four frames from one <span className="italic">tape.</span>
              </h2>
            </div>
            <p className="max-w-[21rem] text-[11px] leading-relaxed text-[#6B6257]">
              Sample footage, clearly labelled. The studio only ever shows your own source, your own
              cuts.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CONTACT_SHEET.map((frame) => (
              <Frame key={frame.caption} {...frame} />
            ))}
          </div>
        </section>

        {/* Rate card */}
        <section id="rates" className="border-t border-[#141210]/25 bg-[#EDE6D9]">
          <div className="mx-auto w-full max-w-[1240px] px-5 py-14 sm:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.38fr_0.62fr] lg:gap-14">
              <div>
                <p className="font-mono text-[8px] tracking-[0.14em] text-[#6B6257] uppercase">
                  Rate card
                </p>
                <h2 className="mt-3 max-w-[12ch] text-[clamp(1.8rem,3.2vw,2.6rem)] leading-[1.02] font-normal tracking-[-0.04em]">
                  Priced by the <span className="italic">minute.</span>
                </h2>
                <p className="mt-4 max-w-[20rem] text-[12px] leading-relaxed text-[#6B6257]">
                  One credit is one minute of source, rounded up. Renders are not metered. A failed
                  job refunds its credits. Billing is not live in this preview.
                </p>
              </div>

              <div className="border-t border-[#141210]/30">
                {RATES.map((rate) => (
                  <div
                    key={rate.name}
                    className="grid gap-3 border-b border-[#141210]/25 py-5 sm:grid-cols-[92px_1fr_auto] sm:items-center sm:gap-6"
                  >
                    <div>
                      <p className="font-serif text-[20px] leading-none">{rate.name}</p>
                      <p className="mt-1 font-mono text-[8px] tracking-[0.1em] text-[#6B6257] uppercase">
                        {rate.lead ? "Launch plan" : "No card"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[15px] font-medium">
                        {rate.price}{" "}
                        <span className="text-[11px] font-normal text-[#6B6257]">
                          {rate.note}
                        </span>
                      </p>
                      <p className="mt-1 text-[11px] text-[#6B6257]">{rate.includes}</p>
                    </div>
                    <Link
                      href="/signup"
                      className={`inline-flex h-9 items-center justify-center px-4 text-[11px] transition-[filter,transform] active:scale-[0.99] ${
                        rate.lead
                          ? "bg-[#141210] font-medium text-[#F3EEE4] hover:brightness-110"
                          : "border border-[#141210]/40 text-[#141210] hover:border-[#141210]"
                      }`}
                    >
                      {rate.cta}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Coupon CTA */}
        <section className="mx-auto w-full max-w-[1240px] px-5 py-14 sm:px-8">
          <div className="border-2 border-dashed border-[#141210]/35 bg-[#F3EEE4] px-6 py-10 sm:px-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-[8px] tracking-[0.14em] text-[#E2402C] uppercase">
                  Clip this
                </p>
                <p className="mt-3 max-w-[22ch] font-serif text-[clamp(1.9rem,5vw,3.4rem)] leading-[0.96] tracking-[-0.03em]">
                  Start with 30 free credits.
                </p>
                <p className="mt-2 text-[12px] text-[#6B6257]">
                  One 15-minute source. About five cuts. No card.
                </p>
              </div>
              <Link
                href="/signup"
                className="inline-flex h-11 shrink-0 items-center gap-2 bg-[#E2402C] px-5 text-[12px] font-semibold text-[#F3EEE4] transition-[filter,transform] hover:brightness-105 active:scale-[0.99]"
              >
                Start free
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#141210]/25">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-2 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-mono text-[8px] tracking-[0.12em] text-[#6B6257] uppercase">
            © 2026 ClipMax · The Cut · Set in Instrument Serif &amp; Geist
          </p>
          <p className="font-mono text-[8px] tracking-[0.12em] text-[#6B6257] uppercase">
            Sample frames are labelled · the studio runs on real data
          </p>
        </div>
      </footer>
    </div>
  );
}
