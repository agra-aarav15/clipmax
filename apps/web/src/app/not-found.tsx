import { ArrowLeftIcon, ArrowUpRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ClipMaxMark } from "@/components/brand/clipmax-mark";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you asked for was moved, renamed, or never existed in this build.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#08090a]">

      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_42%_at_50%_-6%,rgba(21,94,239,0.20),transparent_68%)]" />
        <div className="absolute inset-0 hairline-grid opacity-25 [mask-image:linear-gradient(to_bottom,black,transparent_65%)]" />
        <div className="absolute inset-0 film-grain opacity-[0.035] mix-blend-overlay" />
      </div>

      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="mx-auto flex h-[72px] w-full max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="ClipMax home">
            <ClipMaxMark className="size-7 transition-transform duration-300 group-hover:-rotate-6" />
            <span className="text-[17px] font-semibold tracking-[-0.03em]">ClipMax</span>
            <span className="h-3 w-px bg-white/10" />
            <span className="font-mono text-[8px] tracking-[0.18em] text-zinc-500 uppercase">
              404
            </span>
          </Link>

          <Link
            href="/"
            className="group inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.025] px-3.5 text-[12px] text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
          >
            <ArrowLeftIcon className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to site
          </Link>
        </div>
      </header>

      <main id="main" className="relative z-10 flex flex-1 items-center">
        <div className="mx-auto w-full max-w-[1180px] px-5 py-20 sm:px-8">
          <div className="max-w-3xl">
            <p className="font-mono text-[9px] tracking-[0.22em] text-signal uppercase">
              Error · 404
            </p>
            <h1 className="mt-4 text-[clamp(2.75rem,7vw,5.4rem)] leading-[0.94] font-semibold tracking-[-0.06em] text-balance">
              This frame is{" "}
              <span className="font-serif text-[1.06em] font-normal tracking-[-0.03em] text-signal italic">
                empty.
              </span>
            </h1>
            <p className="mt-6 max-w-[36rem] text-[14.5px] leading-relaxed text-zinc-400">
              The page you asked for was moved, renamed, or never existed in this build. No project
              or credit was touched. Head back to the studio, or tell us which link broke.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[13px] font-semibold text-primary-foreground shadow-[0_14px_40px_-18px_rgba(21,94,239,0.9)] transition-[filter,transform] hover:brightness-110 active:scale-[0.99]"
              >
                Return to studio
              </Link>
              <Link
                href="/support"
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-5 text-[13px] text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
              >
                Report a broken link
                <ArrowUpRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            <p className="mt-8 font-mono text-[8px] tracking-[0.16em] text-zinc-600 uppercase">
              Not signed in?{" "}
              <Link href="/signup" className="text-zinc-400 underline-offset-4 hover:underline">
                Start a studio
              </Link>{" "}
              ·{" "}
              <Link href="/status" className="text-zinc-400 underline-offset-4 hover:underline">
                Service status
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase">
            © 2026 ClipMax · Private beta
          </p>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {[
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
              { href: "/refund", label: "Refunds" },
              { href: "/support", label: "Support" },
              { href: "/status", label: "Status" },
            ].map((link) => (
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
