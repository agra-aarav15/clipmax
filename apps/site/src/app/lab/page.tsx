import { ArrowUpRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ClipMaxMark } from "@/components/brand/clipmax-mark";
import { LabNav } from "../../components/lab-nav";

export const metadata: Metadata = {
  title: "Design lab",
  description:
    "Four complete ClipMax landing pages, built to be felt rather than described. Pick the one that moves you.",
};

const CONCEPTS = [
  {
    id: "cutting-room",
    href: "/lab/cutting-room",
    index: "01",
    name: "Cutting Room",
    line: "A lamplit edit bay. Film strip, timecodes, sodium light.",
    palette: ["#0B0908", "#F3EBDD", "#FFA24B", "#9BE7FF"],
    type: "Geist · Instrument Serif italic · Geist Mono",
  },
  {
    id: "paper-edit",
    href: "/lab/paper-edit",
    index: "02",
    name: "Paper Edit",
    line: "A printed magazine. Cream stock, ink, a red marker.",
    palette: ["#F3EEE4", "#141210", "#E2402C", "#6B6257"],
    type: "Instrument Serif · Geist · Geist Mono",
  },
  {
    id: "hook-machine",
    href: "/lab/hook-machine",
    index: "03",
    name: "Hook Machine",
    line: "The product performs its own feature in kinetic captions.",
    palette: ["#000000", "#F4F2ED", "#D8FF3E", "#8A867E"],
    type: "Geist Bold · Geist Mono",
  },
  {
    id: "gallery",
    href: "/lab/gallery",
    index: "04",
    name: "Gallery",
    line: "A dark room. A wall of vertical frames. Almost no UI.",
    palette: ["#0D0D0E", "#EDE7DB", "#A29B90", "#155EEF"],
    type: "Geist display · Instrument Serif · Geist Mono",
  },
] as const;

export default function LabPage() {
  return (
    <div className="relative min-h-dvh overflow-x-clip bg-[#08090a] text-[#F2F1EC]">
      <LabNav active="" />

      <main className="mx-auto w-full max-w-[1200px] px-5 pb-24 sm:px-8">
        <header className="pt-14 pb-12 sm:pt-20">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="ClipMax home">
            <ClipMaxMark className="size-6" />
            <span className="text-[15px] font-semibold tracking-[-0.03em]">ClipMax</span>
          </Link>

          <h1 className="mt-10 max-w-[18ch] text-[clamp(2.4rem,5.6vw,4.4rem)] leading-[0.92] font-semibold tracking-[-0.065em] text-balance">
            Four rooms.
            <br />
            <span className="font-serif text-[1.06em] font-normal tracking-[-0.035em] text-signal italic">
              Walk into each.
            </span>
          </h1>
          <p className="mt-5 max-w-[40rem] text-[15px] leading-relaxed text-pretty text-zinc-400">
            These are not mood boards. Each is a complete, responsive landing page with real copy,
            real pricing, and a distinct world. Open one, scroll it, resize it. The one that makes
            you feel something is the one we build the studio around.
          </p>
        </header>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07]">
          {CONCEPTS.map((concept) => (
            <Link
              key={concept.id}
              href={concept.href}
              className="group grid gap-5 bg-[#0a0b0c] p-5 transition-colors hover:bg-[#101113] sm:grid-cols-[56px_1.1fr_0.9fr_auto] sm:items-center sm:p-6"
            >
              <span className="font-mono text-[10px] tracking-[0.16em] text-zinc-600">
                {concept.index}
              </span>

              <span>
                <span className="flex items-baseline gap-3">
                  <span className="text-[1.35rem] font-medium tracking-[-0.035em] text-zinc-100">
                    {concept.name}
                  </span>
                  <span className="font-mono text-[8px] tracking-[0.12em] text-zinc-600 uppercase">
                    full page
                  </span>
                </span>
                <span className="mt-1 block text-[12px] leading-relaxed text-zinc-500">
                  {concept.line}
                </span>
              </span>

              <span className="flex items-center gap-4">
                <span className="flex gap-1" aria-hidden="true">
                  {concept.palette.map((hex) => (
                    <span
                      key={hex}
                      className="size-6 rounded-[4px] border border-white/10"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </span>
                <span className="hidden font-mono text-[8px] tracking-[0.06em] text-zinc-600 lg:block">
                  {concept.type}
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 transition-colors group-hover:text-white">
                Enter
                <ArrowUpRightIcon
                  className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-6 max-w-[44rem] text-[12px] leading-relaxed text-zinc-600">
          The same product truth sits under all four: 15-minute sources, 1080 × 1920 output,
          word-level burned captions, 1 credit per source minute, and honest states when a service
          is not configured. Only the world changes.
        </p>
      </main>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2 px-5 py-4 font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© 2026 ClipMax · Design lab</span>
          <span>Static concept builds · the studio is the full app</span>
        </div>
      </footer>
    </div>
  );
}
