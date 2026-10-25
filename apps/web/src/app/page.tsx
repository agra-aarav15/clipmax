import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ClipMaxMark } from "@/components/brand/clipmax-mark";
import { AccountDeletedNotice } from "@/components/landing/account-deleted-notice";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { LandingMotion } from "@/components/landing/landing-motion";
import { PreviewSection } from "@/components/landing/preview-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { SiteHeader } from "@/components/landing/site-header";
import { SystemSection } from "@/components/landing/system-section";
import { WorkflowSection } from "@/components/landing/workflow-section";

const FOOTER_LINKS = [
  { href: "#preview", label: "Preview" },
  { href: "#pipeline", label: "Workflow" },
  { href: "#system", label: "System" },
  { href: "#pricing", label: "Pricing" },
] as const;

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund", label: "Refunds" },
  { href: "/support", label: "Support" },
  { href: "/status", label: "Status" },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <LandingMotion />
      <Suspense fallback={null}>
        <AccountDeletedNotice />
      </Suspense>
      <SiteHeader />

      <main id="main">
        <Hero />
        <PreviewSection />
        <WorkflowSection />
        <SystemSection />
        <PricingSection />
        <FinalCta />
      </main>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-[1320px] px-5 py-10 sm:px-8">
          <div className="flex flex-col gap-9 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <ClipMaxMark className="size-5" />
                <span className="text-sm font-semibold tracking-[-0.02em]">ClipMax</span>
                <span className="font-mono text-[8px] tracking-[0.16em] text-zinc-600 uppercase">
                  Studio
                </span>
              </div>
              <p className="mt-3 max-w-[19rem] text-xs leading-relaxed text-zinc-500">
                An AI cutting room for people with a long back catalogue and no time to scrub it.
              </p>
            </div>

            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2.5">
              {FOOTER_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex min-h-8 items-center text-xs text-zinc-500 transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/dashboard"
                className="flex min-h-8 items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-foreground"
              >
                Studio
                <ArrowUpRightIcon className="size-3" aria-hidden="true" />
              </Link>
              <Link
                href="/signup"
                className="flex min-h-8 items-center text-xs text-zinc-500 transition-colors hover:text-foreground"
              >
                Start free
              </Link>
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-8 items-center text-xs text-zinc-600 transition-colors hover:text-zinc-300"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div>
              <p className="font-mono text-[8px] tracking-[0.16em] text-zinc-600 uppercase">
                Under the hood
              </p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                Supabase · Cloudflare R2 · FFmpeg
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                Hosted storage and a real job queue. No local renders pretending to be a product.
              </p>
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase">
              © 2026 ClipMax · Private beta · v0.1
            </p>
            <p className="font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase">
              Sample visuals are labelled. The studio runs on real data.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
