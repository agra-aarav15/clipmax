import {
  ActivityIcon,
  ArrowRightIcon,
  CpuIcon,
  DatabaseIcon,
  LayersIcon,
  LinkIcon,
  LockKeyholeIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
  UploadIcon,
} from "lucide-react";

import { SectionKicker } from "@/components/landing/section-kicker";

const FLOW = [
  {
    icon: UploadIcon,
    title: "Browser",
    protocol: "Presigned PUT",
    detail: "15-minute signature",
  },
  {
    icon: DatabaseIcon,
    title: "R2 bucket",
    protocol: "Private object",
    detail: "No public access",
  },
  {
    icon: CpuIcon,
    title: "Worker",
    protocol: "Leased job",
    detail: "Service role only",
  },
  {
    icon: LinkIcon,
    title: "Signed GET",
    protocol: "Preview",
    detail: "60-minute URL",
  },
] as const;

const PRINCIPLES = [
  {
    icon: LockKeyholeIcon,
    title: "Private by default",
    body: "Source files live in a private R2 bucket. Uploads and previews use short-lived signatures; nothing is world-readable.",
  },
  {
    icon: LayersIcon,
    title: "Asynchronous by design",
    body: "Uploading, transcription, analysis, and rendering are database jobs. Closing the tab does not cancel the work.",
  },
  {
    icon: ReceiptTextIcon,
    title: "Credits you can audit",
    body: "Every grant, debit, and refund is an append-only ledger row written inside a database transaction.",
  },
  {
    icon: ActivityIcon,
    title: "No invented progress",
    body: "Progress comes from job rows and real FFmpeg output. If a step has not started, the UI says so.",
  },
] as const;

export function SystemSection() {
  return (
    <section
      id="system"
      className="relative scroll-mt-24 overflow-hidden border-b border-white/[0.06]"
    >
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_24%_18%,rgba(21,94,239,0.13),transparent_70%)]" />
        <div className="absolute inset-0 grid-lines opacity-[0.12] [mask-image:radial-gradient(ellipse_at_50%_35%,black,transparent_74%)]" />
      </div>

      <div className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 sm:py-28 lg:py-32">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end lg:gap-16">
          <div data-reveal>
            <SectionKicker index="03">System</SectionKicker>
            <h2 className="mt-5 max-w-[15ch] text-[clamp(2.1rem,4.1vw,3.6rem)] leading-[0.98] font-semibold tracking-[-0.055em] text-balance">
              Built to be trusted with{" "}
              <span className="font-serif text-[1.06em] leading-[0.85] font-normal tracking-[-0.02em] text-signal italic">
                the master file.
              </span>
            </h2>
          </div>

          <div data-reveal className="max-w-sm lg:pb-2">
            <p className="text-[15px] leading-relaxed text-pretty text-zinc-400">
              The browser uploads straight to private storage. The worker runs under a service role.
              The API only ever sees metadata, keys, and signatures.
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {["Supabase RLS", "Private R2", "Service-role worker", "Append-only ledger"].map(
                (item) => (
                  <span
                    key={item}
                    className="flex items-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.025] px-2 py-1 font-mono text-[8px] tracking-[0.1em] text-zinc-500 uppercase"
                  >
                    <ShieldCheckIcon className="size-2.5 text-signal/70" aria-hidden="true" />
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>

        <div
          data-reveal
          className="mt-12 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#08090a]/90 lg:mt-14"
        >
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-3 sm:px-5">
            <span className="font-mono text-[8px] tracking-[0.16em] text-zinc-500 uppercase">
              File path / request path
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-signal/25 bg-signal/[0.06] px-2 py-1 font-mono text-[8px] tracking-[0.12em] text-signal uppercase">
              <LockKeyholeIcon className="size-2.5" aria-hidden="true" />
              Private by default
            </span>
          </div>

          <div className="relative p-4 sm:p-6">
            <div
              className="pointer-events-none absolute inset-0 hero-grid opacity-40"
              aria-hidden="true"
            />

            <div className="relative grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-center">
              {FLOW.map((node, index) => (
                <div key={node.title} className="contents">
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="grid size-8 place-items-center rounded-lg border border-white/[0.08] bg-black/30">
                        <node.icon className="size-3.5 text-signal/80" aria-hidden="true" />
                      </span>
                      <span className="font-mono text-[7px] tracking-[0.14em] text-zinc-600">
                        0{index + 1}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-zinc-200">{node.title}</p>
                    <p className="mt-0.5 font-mono text-[8px] tracking-[0.1em] text-signal/70 uppercase">
                      {node.protocol}
                    </p>
                    <p className="mt-2 text-[10px] text-zinc-600">{node.detail}</p>
                  </div>
                  {index < FLOW.length - 1 ? (
                    <ArrowRightIcon
                      className="mx-auto hidden size-4 text-zinc-700 sm:block"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              ))}
            </div>

            <div className="relative mt-5 flex flex-col gap-2 border-t border-white/[0.07] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-xs leading-relaxed text-zinc-500">
                The app server issues signatures and metadata only. Video bytes never pass through
                it, and the bucket is never public.
              </p>
              <span className="shrink-0 font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase">
                No proxied video
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((principle, index) => (
            <div key={principle.title} data-reveal className="bg-[#08090a] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <principle.icon className="size-4 text-signal/80" aria-hidden="true" />
                <span className="font-mono text-[8px] tracking-[0.14em] text-zinc-700">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-4 text-sm font-medium text-zinc-200">{principle.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">{principle.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
