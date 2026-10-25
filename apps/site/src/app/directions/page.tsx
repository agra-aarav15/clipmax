import { ArrowLeftIcon, ArrowUpRightIcon, CornerDownRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { ClipMaxMark } from "../../../../web/src/components/brand/clipmax-mark";

const REPO_URL = "https://github.com/agra-aarav15/clipmax";
const PLAN_URL = `${REPO_URL}/blob/main/CLIPMAX.md`;

export const metadata: Metadata = {
  title: "Six directions",
  description:
    "Six art-directed directions for the ClipMax landing page, each with a palette, a type pairing, and one signature interaction.",
};

const DIRECTIONS = [
  { id: "cutting-room", index: "01", name: "Cutting Room" },
  { id: "signal", index: "02", name: "Signal" },
  { id: "paper-edit", index: "03", name: "Paper Edit" },
  { id: "control-room", index: "04", name: "Control Room" },
  { id: "gallery", index: "05", name: "Gallery" },
  { id: "hook-machine", index: "06", name: "Hook Machine" },
] as const;

type Swatch = { name: string; hex: string; note?: string };

function Micro({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`font-mono text-[8px] leading-none tracking-[0.16em] uppercase ${className}`}
    >
      {children}
    </span>
  );
}

function Swatches({ items }: { items: Swatch[] }) {
  return (
    <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
      {items.map((item) => (
        <li key={item.hex} className="flex items-center gap-2">
          <span
            className="size-5 shrink-0 rounded-[5px] border border-white/15"
            style={{ backgroundColor: item.hex }}
            aria-hidden="true"
          />
          <span className="min-w-0">
            <span className="block truncate text-[11px] leading-tight text-zinc-300">
              {item.name}
            </span>
            <span className="block font-mono text-[8px] tracking-[0.08em] text-zinc-600 uppercase">
              {item.hex}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Spec({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-white/[0.07] py-3.5">
      <Micro className="text-zinc-600">{label}</Micro>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">{children}</p>
    </div>
  );
}

function Direction({
  id,
  index,
  name,
  thesis,
  palette,
  type,
  motion,
  why,
  risk,
  artboard,
}: {
  id: string;
  index: string;
  name: string;
  thesis: string;
  palette: Swatch[];
  type: string;
  motion: string;
  why: string;
  risk: string;
  artboard: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-white/[0.07] py-14 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[10px] tracking-[0.16em] text-signal">{index}</span>
            <Micro className="text-zinc-600">Direction</Micro>
          </div>

          <h2 className="mt-3 text-[clamp(1.9rem,3.2vw,2.6rem)] leading-[1.02] font-semibold tracking-[-0.05em]">
            {name}
          </h2>
          <p className="mt-3 max-w-[34rem] text-[14px] leading-relaxed text-pretty text-zinc-400">
            {thesis}
          </p>

          <div className="mt-6">
            <Micro className="text-zinc-600">Palette</Micro>
            <Swatches items={palette} />
          </div>

          <div className="mt-4">
            <Spec label="Type">{type}</Spec>
            <Spec label="Signature motion">{motion}</Spec>
            <Spec label="Why it wins">{why}</Spec>
            <Spec label="The risk">{risk}</Spec>
          </div>
        </div>

        <div>
          {artboard}
          <p className="mt-3 flex items-center gap-2 font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase">
            <CornerDownRightIcon className="size-3" aria-hidden="true" />
            Hero artboard · desktop composition
          </p>
        </div>
      </div>
    </section>
  );
}

/* 01 — Cutting Room ------------------------------------------------ */

function CuttingRoom() {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-[#3A2E24] bg-[#0B0908] p-4 text-[#F3EBDD] sm:p-6">
      <div
        className="pointer-events-none absolute -top-32 right-[-10%] size-[440px] rounded-full bg-[#FFA24B]/12 blur-[90px]"
        aria-hidden="true"
      />
      <div className="relative flex items-center justify-between border-b border-[#3A2E24] pb-3">
        <div className="flex items-center gap-2">
          <ClipMaxMark className="size-5 text-[#F3EBDD]" />
          <span className="text-[13px] font-semibold tracking-[-0.03em]">ClipMax</span>
          <Micro className="text-[#8C7A66]">Studio</Micro>
        </div>
        <Micro className="flex items-center gap-1.5 text-[#FFA24B]">
          <span className="size-1 rounded-full bg-[#FFA24B]" />
          Rec · 00:42:17:08
        </Micro>
      </div>

      <div className="relative mt-5 grid gap-5 sm:grid-cols-[1.15fr_0.85fr] sm:items-end">
        <div>
          <Micro className="text-[#8C7A66]">Long video in</Micro>
          <p className="mt-2 text-[clamp(1.7rem,3.4vw,2.7rem)] leading-[0.92] font-semibold tracking-[-0.055em] text-balance">
            A week of clips
            <br />
            out of one
            <br />
            <span className="font-serif text-[1.08em] font-normal tracking-[-0.03em] text-[#FFA24B] italic">
              conversation.
            </span>
          </p>
          <p className="mt-3 max-w-[22rem] text-[12px] leading-relaxed text-[#B8A995]">
            Hooks found. Frame cropped. Captions burned. Review five vertical cuts before your
            coffee goes cold.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <div className="flex h-9 flex-1 items-center border border-[#3A2E24] bg-[#141010] px-3">
              <span className="truncate font-mono text-[9px] tracking-[0.04em] text-[#8C7A66]">
                youtube.com/watch?v=…
              </span>
            </div>
            <span className="inline-flex h-9 items-center bg-[#F3EBDD] px-3 text-[11px] font-semibold text-[#0B0908]">
              Cut it
            </span>
          </div>
        </div>

        <div className="relative h-[190px]">
          {[
            { x: "0%", y: "26%", quote: "nobody tells you the first year is the quiet one" },
            { x: "30%", y: "10%", quote: "I almost quit in month nine" },
            { x: "60%", y: "0%", quote: "the moment it clicked" },
          ].map((clip, index) => (
            <div
              key={clip.quote}
              className="absolute top-0 aspect-[9/16] w-[38%] overflow-hidden rounded-[6px] border border-[#4A3B2E] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)]"
              style={{ left: clip.x, top: clip.y }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(160deg,#2A1D14,#120C09_55%,#0B0908)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,162,75,0.28),transparent_60%)]" />
              <div className="absolute inset-x-1.5 top-1/2 -translate-y-1/2 text-center">
                <span className="text-[8px] leading-[1.25] font-semibold tracking-[-0.01em] text-[#F3EBDD] uppercase">
                  {clip.quote}
                </span>
              </div>
              <span className="absolute right-1 bottom-1 rounded-[2px] bg-black/60 px-1 py-0.5 font-mono text-[6px] text-[#FFA24B]">
                00:{12 + index * 9}
              </span>
              <span className="absolute top-1 left-1 size-1 rounded-full bg-[#FFA24B]" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-4 flex items-end justify-between gap-3 border-t border-[#3A2E24] pt-3">
        <div className="flex h-6 items-end gap-[2px]">
          {Array.from({ length: 54 }).map((_, index) => (
            <span
              key={index}
              className="w-[2px] bg-[#FFA24B]/60"
              style={{ height: `${18 + ((index * 13) % 26)}%` }}
            />
          ))}
        </div>
        <Micro className="text-[#8C7A66]">5 cuts · 00:31–00:58 · 9:16</Micro>
      </div>
    </div>
  );
}

/* 02 — Signal ------------------------------------------------------ */

const WAVE = [
  12, 26, 18, 42, 30, 58, 44, 72, 38, 52, 20, 64, 48, 78, 34, 56, 26, 68, 40, 86, 32, 50, 22, 62,
  46, 76, 28, 54, 36, 88, 24, 60, 42, 70, 30, 48, 18, 66, 38, 82, 26, 56, 44, 74, 34, 52, 20, 64,
];

function Signal() {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-[#1B2A4A] bg-[#08090A] p-4 text-[#F2F1EC] sm:p-6">
      <div className="absolute inset-0 grid-lines opacity-[0.35]" aria-hidden="true" />
      <div
        className="absolute top-0 left-[58%] h-full w-[42%] bg-[#155EEF]/12"
        aria-hidden="true"
      />
      <div className="relative flex items-center justify-between">
        <Micro className="text-[#9BE7FF]">ClipMax / 02</Micro>
        <Micro className="text-zinc-600">Source → cut → frame</Micro>
      </div>

      <div className="relative mt-6 grid gap-6 sm:grid-cols-[1.25fr_0.75fr]">
        <div>
          <p className="text-[clamp(1.7rem,3.6vw,2.9rem)] leading-[0.9] font-semibold tracking-[-0.065em] text-balance">
            Every long video
            <br />
            hides a{" "}
            <span className="relative inline-block">
              <span className="relative z-10 px-1 text-[#03122E]">week</span>
              <span className="absolute inset-0 z-0 bg-[#155EEF]" aria-hidden="true" />
            </span>
            <br />
            <span className="font-serif text-[1.06em] font-normal tracking-[-0.03em] text-[#9BE7FF] italic">
              of clips.
            </span>
          </p>
          <p className="mt-4 max-w-[24rem] text-[12px] leading-relaxed text-zinc-400">
            Paste a source. ClipMax reads the transcript, scores the moments, crops the frame, and
            returns vertical cuts with burned captions.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#9BE7FF]/30 bg-[#9BE7FF]/8 px-3 py-1.5">
            <span className="size-1 rounded-full bg-[#9BE7FF]" />
            <Micro className="text-[#9BE7FF]">1 credit = 1 minute</Micro>
          </div>
        </div>

        <div className="border-l border-[#1B2A4A] pl-4">
          {[
            ["01", "Transcribe", "word-level"],
            ["02", "Find hooks", "scored"],
            ["03", "Frame", "9:16 crop"],
            ["04", "Burn captions", "libass"],
          ].map(([n, label, meta]) => (
            <div key={n} className="border-b border-[#1B2A4A] py-2.5 last:border-b-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12px] text-zinc-200">{label}</span>
                <span className="font-mono text-[8px] tracking-[0.1em] text-zinc-600 uppercase">
                  {meta}
                </span>
              </div>
              <span className="font-mono text-[7px] tracking-[0.16em] text-[#9BE7FF]/70">
                {n}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-6 border-t border-[#1B2A4A] pt-3">
        <div className="flex items-center justify-between font-mono text-[7px] tracking-[0.14em] text-zinc-600 uppercase">
          <span>00:00</span>
          <span className="text-[#9BE7FF]">00:12:40 / 00:42:17</span>
          <span>00:42:17</span>
        </div>
        <div className="mt-2 flex h-12 items-end gap-[2px]">
          {WAVE.map((height, index) => (
            <span
              key={index}
              className="flex-1 rounded-t-[1px]"
              style={{
                height: `${height}%`,
                backgroundColor: index < 18 ? "#9BE7FF" : "rgba(155,231,255,0.22)",
              }}
            />
          ))}
        </div>
        <div className="relative mt-1 h-3">
          <span className="absolute top-0 left-[26%] h-3 w-px bg-[#F2F1EC]" />
          <span className="absolute top-0 left-[26%] -translate-x-1/2 rounded-[2px] bg-[#F2F1EC] px-1 py-0.5 font-mono text-[6px] text-[#08090A]">
            12:40
          </span>
        </div>
      </div>
    </div>
  );
}

/* 03 — Paper Edit -------------------------------------------------- */

function ContactTile({ tone, caption }: { tone: string; caption: string }) {
  return (
    <div>
      <div className={`relative aspect-[3/4] overflow-hidden border border-[#1A1714]/20 ${tone}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_25%,rgba(255,255,255,0.32),transparent_65%)]" />
        <div className="absolute inset-x-2 bottom-2">
          <span className="font-serif text-[10px] leading-[1.15] text-[#1A1714] italic">
            “the part nobody clips”
          </span>
        </div>
        <span className="absolute top-1.5 left-1.5 border border-[#1A1714]/30 px-1 font-mono text-[6px] tracking-[0.1em] text-[#1A1714] uppercase">
          Sample
        </span>
      </div>
      <p className="mt-1.5 font-mono text-[7px] tracking-[0.1em] text-[#6B6257] uppercase">
        {caption}
      </p>
    </div>
  );
}

function PaperEdit() {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-[#D9D2C4] bg-[#F2EDE3] p-5 text-[#141210] sm:p-7">
      <div className="flex items-center justify-between border-b border-[#141210]/20 pb-2">
        <Micro className="text-[#6B6257]">ClipMax · The Cut · Issue 01</Micro>
        <Micro className="text-[#6B6257]">Long video, short form</Micro>
      </div>

      <div className="mt-4 grid gap-6 sm:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-[clamp(1.6rem,3.4vw,2.65rem)] leading-[0.94] font-normal tracking-[-0.035em] text-balance">
            Every good clip is an{" "}
            <span className="relative inline-block">
              argument
              <span
                className="absolute -bottom-1 left-0 h-[5px] w-full -rotate-1 bg-[#E2402C]/85"
                aria-hidden="true"
              />
            </span>{" "}
            for the <span className="italic">moment.</span>
          </p>

          <div className="mt-4 grid gap-4 text-[11px] leading-relaxed text-[#3A342C] sm:grid-cols-2">
            <p>
              <span className="float-left mt-0.5 mr-1.5 font-serif text-[30px] leading-[0.8]">
                W
              </span>
              e cut the scroll, not the story. ClipMax reads the transcript the way an editor does:
              who is talking, where the turn lands, which sentence makes you stop.
            </p>
            <p>
              Then it does the unglamorous part. Reframes a horizontal master for a vertical feed,
              sets the captions, exports a file you can post. The argument stays yours.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-[#141210]/15 pt-3">
            <span className="inline-flex h-8 items-center bg-[#141210] px-3 text-[10px] font-medium text-[#F2EDE3]">
              Paste a link
            </span>
            <span className="font-mono text-[8px] tracking-[0.08em] text-[#6B6257]">
              or drop an MP4 · 15 min max
            </span>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-3 gap-2">
            <ContactTile tone="bg-[#CDBFA9]" caption="01 · Hook" />
            <ContactTile tone="bg-[#B7A791]" caption="02 · Turn" />
            <ContactTile tone="bg-[#9C8B75]" caption="03 · Payoff" />
          </div>
          <div className="mt-3 border-t border-[#141210]/20 pt-2">
            <p className="font-serif text-[13px] leading-snug italic">
              “The first year is the quiet one. Nobody tells you that.”
            </p>
            <p className="mt-1 font-mono text-[7px] tracking-[0.1em] text-[#6B6257] uppercase">
              Hook line · 84 chars · scored 92
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[#141210]/20 pt-2">
        <Micro className="text-[#6B6257]">Set in Instrument Serif &amp; Geist</Micro>
        <Micro className="text-[#E2402C]">Cut here →</Micro>
      </div>
    </div>
  );
}

/* 04 — Control Room ------------------------------------------------ */

function ControlRoom() {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-[#20261A] bg-[#050607] p-4 font-mono text-[#DDE3D6] sm:p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(200,255,90,0.045) 0px, rgba(200,255,90,0.045) 1px, transparent 1px, transparent 4px)",
        }}
        aria-hidden="true"
      />
      <div className="relative flex items-center justify-between border-b border-[#20261A] pb-2">
        <Micro className="text-[#C8FF5A]">clipmax / operator</Micro>
        <Micro className="text-[#5C6B52]">us-east · node-04</Micro>
      </div>

      <div className="relative mt-4 grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-1 text-[8px] leading-relaxed tracking-[0.02em] text-[#6E7C64]">
          {[
            ["12:40:02", "claim job 4f2a", "ok"],
            ["12:40:04", "get object 812mb", "ok"],
            ["12:40:11", "ffprobe 42:17", "ok"],
            ["12:40:19", "audio 16k mono", "ok"],
            ["12:41:02", "transcribe 7,412w", "ok"],
            ["12:41:09", "score 5 moments", "ok"],
            ["12:41:31", "render 9:16", "run"],
          ].map(([time, line, state]) => (
            <div key={line} className="flex items-baseline gap-2">
              <span className="text-[#39422F]">{time}</span>
              <span className="flex-1 truncate">{line}</span>
              <span className={state === "run" ? "text-[#C8FF5A]" : "text-[#4E5B45]"}>
                {state}
              </span>
            </div>
          ))}
        </div>

        <div className="border border-[#28301F] bg-[#080A08]">
          <div className="border-b border-[#28301F] px-2 py-1.5 text-[8px] tracking-[0.06em] text-[#5C6B52]">
            ingest
          </div>
          <div className="space-y-2 p-2 text-[9px] leading-relaxed">
            <p className="text-[#C8FF5A]">
              $ clipmax cut https://youtu.be/…
            </p>
            {[
              ["transcribe", 100],
              ["highlights", 100],
              ["render", 62],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <div className="flex justify-between text-[8px] text-[#8A9682]">
                  <span>{label}</span>
                  <span>{value}%</span>
                </div>
                <div className="mt-1 h-1 bg-[#1A2016]">
                  <div
                    className="h-1 bg-[#C8FF5A]"
                    style={{ width: `${value as number}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="text-[8px] text-[#5C6B52]">
              3 of 5 clips ready · 1080×1920 · h264
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-[#20261A] pt-3">
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center border border-[#C8FF5A] text-[9px] text-[#C8FF5A]">
            ↳
          </span>
          <span className="text-[10px] text-[#DDE3D6]">
            queue is a table, not a promise
          </span>
        </div>
        <Micro className="text-[#5C6B52]">SKIP LOCKED · LEASE 90s</Micro>
      </div>
    </div>
  );
}

/* 05 — Gallery ----------------------------------------------------- */

const POSTERS = [
  { tone: "bg-[linear-gradient(170deg,#3A3630,#141312_70%)]", y: "0px", quote: "I stopped guessing" },
  { tone: "bg-[linear-gradient(170deg,#4A4238,#161514_70%)]", y: "34px", quote: "the quiet year" },
  { tone: "bg-[linear-gradient(170deg,#2E3136,#111214_70%)]", y: "10px", quote: "ask better questions" },
  { tone: "bg-[linear-gradient(170deg,#3D332C,#131211_70%)]", y: "46px", quote: "ship the small thing" },
  { tone: "bg-[linear-gradient(170deg,#33322E,#121212_70%)]", y: "20px", quote: "taste is a skill" },
];

function Gallery() {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-[#272726] bg-[#0E0E0F] px-4 pt-4 pb-5 text-[#EDE7DB] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <Micro className="text-[#8B857B]">ClipMax · Selected cuts</Micro>
        <Micro className="text-[#5E5A54]">Room 01</Micro>
      </div>

      <div className="relative mt-6 h-[210px] overflow-hidden sm:h-[240px]">
        <div className="absolute inset-x-0 top-0 flex items-start justify-center gap-2 sm:gap-3">
          {POSTERS.map((poster, index) => (
            <div
              key={poster.quote}
              className={`relative aspect-[9/16] w-[17%] shrink-0 overflow-hidden rounded-[3px] border border-white/10 ${poster.tone}`}
              style={{ marginTop: poster.y }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(255,255,255,0.16),transparent_62%)]" />
              <div className="absolute inset-x-1.5 top-1/2 -translate-y-1/2 text-center">
                <p className="text-[7px] leading-[1.3] font-medium tracking-[-0.01em] text-[#EDE7DB] uppercase">
                  {poster.quote}
                </p>
              </div>
              <span className="absolute right-1 bottom-1 font-mono text-[6px] text-[#A9A29A]">
                0:{18 + index * 6}
              </span>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0E0E0F] to-transparent" />
      </div>

      <div className="relative mt-2 flex flex-col gap-4 border-t border-[#272726] pt-5 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-[clamp(1.9rem,4vw,3.1rem)] leading-[0.86] font-normal tracking-[-0.07em]">
          The moment,
          <br />
          <span className="font-serif italic">framed.</span>
        </p>
        <div className="max-w-[16rem] border-l border-[#155EEF] pl-3">
          <p className="text-[11px] leading-relaxed text-[#A9A29A]">
            One hour of tape. Five frames worth keeping. Every cut arrives vertical, captioned, and
            ready to publish.
          </p>
          <p className="mt-2 font-mono text-[7px] tracking-[0.12em] text-[#5E5A54] uppercase">
            Sample cuts · not a live project
          </p>
        </div>
      </div>
    </div>
  );
}

/* 06 — Hook Machine ------------------------------------------------ */

function HookMachine() {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-[#242424] bg-black p-4 text-[#F4F2ED] sm:p-6">
      <div className="pointer-events-none absolute inset-0 film-grain opacity-[0.06]" aria-hidden="true" />
      <div className="relative flex items-center justify-between">
        <Micro className="text-[#6F6B64]">CapCut · 9:16 · 00:31</Micro>
        <Micro className="flex items-center gap-1.5 text-[#D8FF3E]">
          <span className="size-1 rounded-full bg-[#D8FF3E]" />
          Hook 92
        </Micro>
      </div>

      <div className="relative mt-6 flex items-center justify-center">
        <div className="relative w-full max-w-[330px]">
          <span className="absolute -top-2 -left-2 size-3 border-t border-l border-white/20" />
          <span className="absolute -top-2 -right-2 size-3 border-t border-r border-white/20" />
          <span className="absolute -bottom-2 -left-2 size-3 border-b border-l border-white/20" />
          <span className="absolute -right-2 -bottom-2 size-3 border-r border-b border-white/20" />

          <p className="text-center text-[clamp(1.8rem,4.4vw,2.9rem)] leading-[0.9] font-bold tracking-[-0.045em] uppercase">
            Nobody tells you
            <br />
            the first year is
            <br />
            <span className="relative inline-block">
              <span className="relative z-10 px-1 text-black">the quiet one</span>
              <span className="absolute inset-x-0 inset-y-0 z-0 skew-y-[-1.5deg] bg-[#D8FF3E]" />
            </span>
          </p>

          <div className="mt-5 flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-[#F4F2ED] text-black">
              <span className="ml-0.5 block size-0 border-y-[4px] border-l-[6px] border-y-transparent border-l-black" />
            </span>
            <div className="relative h-1 flex-1 bg-white/15">
              <div className="absolute inset-y-0 left-0 w-[42%] bg-[#D8FF3E]" />
              <span className="absolute top-1/2 left-[42%] size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F4F2ED]" />
            </div>
            <span className="font-mono text-[7px] tracking-[0.08em] text-[#6F6B64]">0:13</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            {["bold", "word-level", "burned in"].map((chip) => (
              <span
                key={chip}
                className="border border-white/15 px-2 py-1 font-mono text-[7px] tracking-[0.1em] text-[#A8A49C] uppercase"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-6 flex items-end justify-between border-t border-[#242424] pt-3">
        <div>
          <Micro className="text-[#6F6B64]">Source 42:17</Micro>
          <p className="mt-1 font-mono text-[9px] text-[#A8A49C]">00:12:40 → 00:13:11</p>
        </div>
        <span className="inline-flex h-8 items-center gap-1.5 bg-[#D8FF3E] px-3 text-[10px] font-semibold text-black">
          Download
          <ArrowUpRightIcon className="size-3" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

/* Page ------------------------------------------------------------- */

export default function DirectionsPage() {
  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px]" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_-10%,rgba(21,94,239,0.18),transparent_65%)]" />
        <div className="absolute inset-0 hero-dots opacity-[0.14] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
        <div className="absolute inset-0 film-grain opacity-[0.035] mix-blend-overlay" />
      </div>

      <header className="relative z-10 mx-auto flex h-[72px] w-full max-w-[1360px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="ClipMax home">
          <ClipMaxMark className="size-7 transition-transform duration-300 group-hover:-rotate-6" />
          <span className="text-[17px] font-semibold tracking-[-0.03em]">ClipMax</span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <Micro className="hidden text-zinc-500 sm:block">Directions</Micro>
        </Link>

        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.14em] text-zinc-500 uppercase transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3 transition-transform group-hover:-translate-x-0.5" />
          Back to site
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1360px] px-5 pb-24 sm:px-8">
        <section className="pt-10 pb-14 sm:pt-16">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-signal/25 bg-signal/[0.06] px-3 py-1.5">
              <span className="size-1.5 rounded-full bg-signal" aria-hidden="true" />
              <Micro className="text-signal">Design decision · pick one</Micro>
            </span>
            <Micro className="text-zinc-600">6 directions · 1 landing page</Micro>
          </div>

          <h1 className="mt-6 max-w-[20ch] text-[clamp(2.4rem,5.4vw,4.6rem)] leading-[0.9] font-semibold tracking-[-0.065em] text-balance">
            Six ways to cut
            <br />
            <span className="font-serif text-[1.06em] font-normal tracking-[-0.035em] text-signal italic">
              a frame.
            </span>
          </h1>

          <p className="mt-5 max-w-[42rem] text-[15px] leading-relaxed text-pretty text-zinc-400">
            Each direction is a complete world, not a theme switch: its own palette, type, motion,
            and hero composition. Every one is buildable in the current Next.js, Tailwind, GSAP, and
            Lenis stack, with the real product underneath. Pick one; it becomes the contract for the
            rebuilt landing page, signup, studio shell, and every email.
          </p>

          <nav aria-label="Directions" className="mt-8 flex flex-wrap gap-x-2 gap-y-2">
            {DIRECTIONS.map((direction) => (
              <a
                key={direction.id}
                href={`#${direction.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 font-mono text-[9px] tracking-[0.1em] text-zinc-400 uppercase transition-colors hover:border-white/25 hover:text-foreground"
              >
                <span className="text-zinc-600">{direction.index}</span>
                {direction.name}
              </a>
            ))}
          </nav>
        </section>

        <Direction
          id="cutting-room"
          index="01"
          name="Cutting Room"
          thesis="A warm, lamplit edit bay at midnight. The page behaves like a film strip: perforations, timecodes, and a monitor that gives way to vertical cuts. Cinematic, quiet, confident."
          palette={[
            { name: "Carbon", hex: "#0B0908" },
            { name: "Bone", hex: "#F3EBDD" },
            { name: "Sodium", hex: "#FFA24B" },
            { name: "Ice", hex: "#9BE7FF" },
          ]}
          type="Geist for UI and display, Instrument Serif italic for the one emotional word per screen, Geist Mono for timecodes and source metadata."
          motion="Scroll pins a 16:9 monitor; as it advances the frame splits into three 9:16 panels and the perforation strip drifts. One ambient lamp glow, no loops elsewhere."
          why="It owns the only metaphor that is actually true for this product. Warm black plus sodium escapes the blue-gradient AI category instantly, and the split-frame moment demonstrates the transformation better than any copy."
          risk="Warm darkness drifts toward film-podcast nostalgia. Keep the type scale strict, keep the amber to moments of action, and never add a second warm accent."
          artboard={<CuttingRoom />}
        />

        <Direction
          id="signal"
          index="02"
          name="Signal"
          thesis="Precision engineering, Swiss grid, and one electric charge. The page is an instrument: every section is a timestamp on a waveform that advances as you scroll."
          palette={[
            { name: "Ink", hex: "#08090A" },
            { name: "Cobalt", hex: "#155EEF" },
            { name: "Ice", hex: "#9BE7FF" },
            { name: "Paper", hex: "#F2F1EC" },
          ]}
          type="Geist at tight negative tracking for display, Instrument Serif for the italic counterpoint, Geist Mono for the data rail. Numerals are the decoration."
          motion="A full-width waveform is the page spine. The playhead is scroll progress; section labels are real timestamps. Hovering a moment previews its hook line. Nothing else moves."
          why="Most credible and fastest to ship. It makes the pipeline visible, which is the actual moat against every competitor that shows a magic box. Reuses the locked cobalt and ice system."
          risk="It is the closest to the current design and to the dark SaaS category, so differentiation depends entirely on motion craft. If the waveform is decorative rather than scroll-linked, it collapses into a normal dark landing page."
          artboard={<Signal />}
        />

        <Direction
          id="paper-edit"
          index="03"
          name="Paper Edit"
          thesis="An editor’s desk, printed. Cream stock, ink, a red marker, and a contact sheet of takes pinned to the page. The only light-mode direction, and the only one that feels like a publication."
          palette={[
            { name: "Stock", hex: "#F2EDE3" },
            { name: "Ink", hex: "#141210" },
            { name: "Marker", hex: "#E2402C" },
            { name: "Rule", hex: "#6B6257" },
          ]}
          type="Instrument Serif for display and pull quotes, Geist for body and interface, Geist Mono for folios, timestamps, and sample labels. A real drop cap, not a decorative one."
          motion="Marker strokes draw on reveal, the contact sheet settles with a paper lift, and sections turn like pages. No parallax, no glow, no grain."
          why="Nobody in this category looks like print. It signals taste in the first second and makes the product feel authored rather than generated, which is exactly the promise."
          risk="Light plus serif can read as an editorial blog if the product proof is weak. It only works with genuinely excellent sample frames and a ruthlessly simple intake."
          artboard={<PaperEdit />}
        />

        <Direction
          id="control-room"
          index="04"
          name="Control Room"
          thesis="The operator’s console. Near-black, phosphor, monospace, and a queue you can read. This direction sells the engineering: real jobs, real leases, real renders."
          palette={[
            { name: "Void", hex: "#050607" },
            { name: "Phosphor", hex: "#C8FF5A" },
            { name: "Ash", hex: "#8A9682" },
            { name: "Bone", hex: "#E7E9E4" },
          ]}
          type="Geist Mono for nearly everything, Geist for the few human sentences, tabular numerals everywhere. Uppercase only for machine labels."
          motion="A live log types in as sections enter, the progress rail fills, and the render panel reveals its clip. Motion is state change, never ambience."
          why="It makes the product impossible to dismiss as a wrapper. Technical buyers and builders trust visible machinery, and the log aesthetic is genuinely rare in creator tools."
          risk="It can read as a developer tool rather than a creator tool. Warmth has to come from the copy and the actual clips; otherwise it is a terminal with a video in it."
          artboard={<ControlRoom />}
        />

        <Direction
          id="gallery"
          index="05"
          name="Gallery"
          thesis="The work speaks. A dark room, a wall of vertical frames, and museum-scale type. Almost no interface at all: the clips are the layout."
          palette={[
            { name: "Charcoal", hex: "#0E0E0F" },
            { name: "Bone", hex: "#EDE7DB" },
            { name: "Stone", hex: "#A9A29A" },
            { name: "Cobalt", hex: "#155EEF" },
          ]}
          type="Geist at display scale with very tight tracking, Instrument Serif only for the last word of a headline, Geist Mono for the placards."
          motion="The clip wall drifts horizontally as you scroll; placards fade in one beat after their frame. Hover lifts a single frame and dims the rest."
          why="Content-first and award-jury friendly. It lets real output do the selling, which is stronger than any diagram, and it looks expensive with very little UI."
          risk="An empty gallery is a dead page. It requires at least five genuinely good sample renders before it can ship, and it must never imply they are the visitor’s clips."
          artboard={<Gallery />}
        />

        <Direction
          id="hook-machine"
          index="06"
          name="Hook Machine"
          thesis="The product performs its own feature. Kinetic, burned-in caption typography is the entire visual language: huge words, one highlighted at a time, one acid accent."
          palette={[
            { name: "Black", hex: "#000000" },
            { name: "Chalk", hex: "#F4F2ED" },
            { name: "Acid", hex: "#D8FF3E" },
            { name: "Ember", hex: "#FF5C39" },
          ]}
          type="Geist Bold uppercase at caption scale with tight leading, Geist Mono for timecodes and scores. The type is the product, so the scale is unforgiving."
          motion="The hero headline snaps in word by word like burned captions, and scroll scrubs the highlight from word to word. One kinetic moment; the rest of the page is still."
          why="It demonstrates the core feature in the first second and has the highest recall of the six. It is also the cheapest to build well, because it is type and timing."
          risk="Kinetic type can overpower the product and read as a gaming or music site. It only works if there is exactly one kinetic moment and the rest is disciplined."
          artboard={<HookMachine />}
        />

        <section className="border-t border-white/[0.07] pt-14 sm:pt-20">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
            <div>
              <Micro className="text-signal">Recommendation</Micro>
              <h2 className="mt-3 text-[clamp(1.9rem,3.4vw,2.8rem)] leading-[1] font-semibold tracking-[-0.055em]">
                Reel One
                <span className="block font-serif text-[1.04em] font-normal tracking-[-0.03em] text-signal italic">
                  Cutting Room × Hook Machine
                </span>
              </h2>
              <p className="mt-4 max-w-[34rem] text-[14px] leading-relaxed text-pretty text-zinc-400">
                Keep the warm cutting room for the page, and borrow the kinetic caption language for
                the hero only. It is the one combination that owns the metaphor, proves the feature,
                and still feels like a studio rather than a dashboard.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
              <p className="text-[13px] leading-relaxed text-zinc-300">
                The palette shifts from cobalt to{" "}
                <span className="text-foreground">sodium amber on warm black</span> if Reel One is
                chosen. Cobalt is retired as a brand colour and kept only where a link needs to read
                as a link. Ice stays for data and focus. That is a real change, so it is recorded as
                a decision, not a tweak.
              </p>

              <div className="mt-5 grid gap-3 border-t border-white/[0.07] pt-5 sm:grid-cols-3">
                {[
                  ["Warm black", "#0A0908"],
                  ["Bone", "#F4EFE6"],
                  ["Sodium", "#FFA24B"],
                ].map(([name, hex]) => (
                  <div key={hex} className="flex items-center gap-2">
                    <span
                      className="size-6 rounded-[6px] border border-white/15"
                      style={{ backgroundColor: hex }}
                      aria-hidden="true"
                    />
                    <span>
                      <span className="block text-[11px] text-zinc-300">{name}</span>
                      <span className="block font-mono text-[8px] tracking-[0.08em] text-zinc-600 uppercase">
                        {hex}
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-2 border-t border-white/[0.07] pt-5 sm:flex-row">
                <a
                  href={PLAN_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-105 active:scale-[0.99]"
                >
                  Read the master plan
                  <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
                </a>
                <Link
                  href="/"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 text-[12px] text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  See the current landing
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-3">
          {[
            ["Who is it for?", "A solo creator with a back catalogue. Cutting Room and Hook Machine speak to them; Control Room speaks to their CTO."],
            ["What must it prove?", "That a real long video becomes real vertical clips. Hook Machine proves it fastest; Gallery proves it most elegantly."],
            ["What can we build best?", "The current stack already carries grain, serif emphasis, and GSAP. Cutting Room is an evolution, not a rewrite."],
          ].map(([question, answer]) => (
            <div key={question} className="bg-[#08090a] p-5">
              <Micro className="text-zinc-600">{question}</Micro>
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-400">{answer}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-2 px-5 py-4 font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© 2026 ClipMax · Direction board</span>
          <span>Reply with one name · the rest is build</span>
        </div>
      </footer>
    </div>
  );
}
