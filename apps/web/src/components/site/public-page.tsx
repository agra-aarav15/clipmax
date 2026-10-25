import { ArrowLeftIcon, ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ClipMaxMark } from "@/components/brand/clipmax-mark";

const POLICY_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund", label: "Refunds" },
  { href: "/support", label: "Support" },
  { href: "/status", label: "Status" },
] as const;

export function PublicPage({
  kicker,
  title,
  accent,
  intro,
  updated,
  children,
}: {
  kicker: string;
  title: string;
  accent?: string;
  intro: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#08090a]">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_82%_-8%,rgba(21,94,239,0.16),transparent_68%)]" />
        <div className="absolute inset-0 hairline-grid opacity-25 [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />
        <div className="absolute inset-0 film-grain opacity-[0.035] mix-blend-overlay" />
      </div>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-signal focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-signal-foreground"
      >
        Skip to content
      </a>

      <header className="relative z-20 border-b border-white/[0.06]">
        <div className="mx-auto flex h-[72px] w-full max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="ClipMax home">
            <ClipMaxMark className="size-7 transition-transform duration-300 group-hover:-rotate-6" />
            <span className="text-[17px] font-semibold tracking-[-0.03em]">ClipMax</span>
            <span className="hidden h-3 w-px bg-white/10 sm:block" />
            <span className="hidden font-mono text-[8px] tracking-[0.18em] text-zinc-500 uppercase sm:block">
              {kicker}
            </span>
          </Link>

          <nav aria-label="Public" className="flex items-center gap-1">
            <Link
              href="/support"
              className="hidden h-9 items-center rounded-full px-3 text-[12px] text-zinc-400 transition-colors hover:text-white sm:flex"
            >
              Support
            </Link>
            <Link
              href="/status"
              className="hidden h-9 items-center rounded-full px-3 text-[12px] text-zinc-400 transition-colors hover:text-white sm:flex"
            >
              Status
            </Link>
            <Link
              href="/"
              className="group inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.025] px-3.5 text-[12px] text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
            >
              <ArrowLeftIcon className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              Back to site
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" className="relative z-10 mx-auto w-full max-w-[1180px] px-5 pt-14 pb-24 sm:px-8 sm:pt-20">
        <div className="max-w-3xl">
          <p className="font-mono text-[9px] tracking-[0.22em] text-signal uppercase">{kicker}</p>
          <h1 className="mt-4 text-[clamp(2.5rem,6vw,4.6rem)] leading-[0.95] font-semibold tracking-[-0.06em] text-balance">
            {title}
            {accent ? (
              <>
                {" "}
                <span className="font-serif text-[1.06em] font-normal tracking-[-0.03em] text-signal italic">
                  {accent}
                </span>
              </>
            ) : null}
          </h1>
          <p className="mt-5 max-w-[42rem] text-[14.5px] leading-relaxed text-zinc-400">{intro}</p>
          <p className="mt-5 font-mono text-[8px] tracking-[0.16em] text-zinc-600 uppercase">
            {updated}
          </p>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_236px] lg:items-start">
          <article className="max-w-3xl space-y-11">{children}</article>

          <aside className="space-y-4 lg:sticky lg:top-8">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="font-mono text-[8px] tracking-[0.18em] text-zinc-600 uppercase">
                The fine print
              </p>
              <ul className="mt-3 space-y-1">
                {POLICY_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex min-h-9 items-center justify-between gap-2 rounded-lg px-2 text-[12px] text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100"
                    >
                      {link.label}
                      <ArrowUpRightIcon className="size-3 text-zinc-700" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-signal/15 bg-signal/[0.035] p-4">
              <p className="font-mono text-[8px] tracking-[0.18em] text-signal/80 uppercase">
                Questions
              </p>
              <p className="mt-2 text-[11.5px] leading-relaxed text-zinc-400">
                Support runs through the public issue tracker during the private beta.
              </p>
              <Link
                href="/support"
                className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] text-signal underline-offset-4 hover:underline"
              >
                How to reach us
                <ArrowUpRightIcon className="size-3" />
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase">
            © 2026 ClipMax · Private beta
          </p>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {POLICY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase transition-colors hover:text-zinc-300"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="scroll-mt-24">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[8px] tracking-[0.16em] text-signal/70">{index}</span>
        <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-zinc-100">{title}</h2>
      </div>
      <div className="mt-3 space-y-3 pl-0 text-[13px] leading-[1.85] text-zinc-400 sm:pl-7">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: readonly ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2.5">
          <span aria-hidden="true" className="mt-[0.7em] size-1 shrink-0 rounded-full bg-zinc-700" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
