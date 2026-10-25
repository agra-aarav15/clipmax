import { getPlan, type PlanTier } from "@clipmax/shared";
import { ArrowUpRightIcon, CircleHelpIcon, PlusIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ClipMaxMark } from "@/components/brand/clipmax-mark";
import { MobileWorkspaceMenu } from "@/components/layout/mobile-workspace-menu";
import { UserMenu } from "@/components/layout/user-menu";
import { WorkspaceNav } from "@/components/layout/workspace-nav";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  configured,
  userEmail,
  credits,
  planTier = "free",
  displayName = null,
}: {
  children: ReactNode;
  configured: boolean;
  userEmail: string | null;
  credits: number | null;
  planTier?: PlanTier;
  displayName?: string | null;
}) {
  const plan = getPlan(planTier) ?? getPlan("free");
  const allowance = plan?.creditsPerMonth ?? 30;
  const meter = credits === null ? 0 : Math.min(100, Math.max(0, (credits / allowance) * 100));

  return (
    <div className="relative min-h-dvh bg-[#08090a]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-signal focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-signal-foreground"
      >
        Skip to workspace
      </a>

      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_78%_-10%,rgba(21,94,239,0.10),transparent_70%)]" />
        <div className="absolute inset-0 hairline-grid opacity-[0.35] [mask-image:linear-gradient(to_bottom,black,transparent_55%)]" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-white/[0.06] bg-[#0a0a0b]/95 backdrop-blur-xl md:flex">
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="ClipMax home">
            <ClipMaxMark className="size-7 transition-transform duration-300 group-hover:-rotate-6" />
            <span className="text-[16px] font-semibold tracking-[-0.03em]">ClipMax</span>
            <span className="rounded border border-white/[0.08] px-1.5 py-0.5 font-mono text-[7px] tracking-[0.16em] text-zinc-600 uppercase">
              Beta
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <Link
            href="/dashboard#new-project"
            className="group flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-[0_10px_35px_-14px_rgba(21,94,239,0.9)] transition-[filter,transform] hover:brightness-110 active:scale-[0.99]"
          >
            <PlusIcon className="size-4" />
            New project
          </Link>

          <div className="mt-7">
            <WorkspaceNav />
          </div>

          <div className="mt-8 rounded-xl border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[8px] tracking-[0.2em] text-zinc-500 uppercase">
                Credits
              </p>
              <Link
                href="/dashboard/billing"
                className="font-mono text-[8px] tracking-[0.14em] text-signal/80 uppercase transition-colors hover:text-signal"
              >
                Manage
              </Link>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-[1.75rem] leading-none tracking-[-0.04em] text-white">
                {credits === null ? "—" : credits}
              </span>
              <span className="font-mono text-[9px] tracking-[0.12em] text-zinc-600 uppercase">
                / {allowance} mo
              </span>
            </div>
            <div
              className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]"
              role="progressbar"
              aria-label="Credit balance against the monthly allowance"
              aria-valuemin={0}
              aria-valuemax={allowance}
              aria-valuenow={credits === null ? 0 : Math.min(credits, allowance)}
            >
              <div
                className={cn(
                  "h-full rounded-full bg-signal/80 transition-[width] duration-700",
                  credits !== null && credits <= 5 && "bg-amber-300/80",
                )}
                style={{ width: `${meter}%` }}
              />
            </div>
            <p className="mt-3 text-[10.5px] leading-relaxed text-zinc-500">
              {plan?.name ?? "Free"} plan · 1 credit = 1 minute
            </p>
          </div>

          {!configured ? (
            <div className="mt-4 rounded-lg border border-amber-300/15 bg-amber-300/[0.03] px-3 py-2.5">
              <p className="flex items-center gap-1.5 font-mono text-[8px] tracking-[0.14em] text-amber-200/80 uppercase">
                <SparklesIcon className="size-3" />
                Preview shell
              </p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-zinc-500">
                Auth and storage keys are not set. The studio shows a real configuration state.
              </p>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-white/[0.06] p-3">
          <UserMenu email={userEmail} plan={plan?.name ?? "Free"} />
        </div>
      </aside>

      <div className="relative z-10 md:pl-[272px]">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between gap-3 border-b border-white/[0.06] bg-[#08090a]/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 md:hidden"
              aria-label="ClipMax studio"
            >
              <ClipMaxMark className="size-6" />
              <span className="text-[15px] font-semibold tracking-[-0.03em]">ClipMax</span>
            </Link>
            <div className="hidden items-center gap-2 md:flex">
              <span className="size-1.5 rounded-full bg-signal/70" aria-hidden="true" />
              <p className="font-mono text-[9px] tracking-[0.18em] text-zinc-500 uppercase">
                Workspace
                {displayName ? (
                  <span className="text-zinc-600"> · {displayName.split(" ")[0]}</span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/dashboard/billing"
              className="flex h-8 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.025] px-2.5 transition-colors hover:border-signal/25 hover:bg-signal/[0.05] md:hidden"
              aria-label={`${credits === null ? "No" : credits} credits. Open billing.`}
            >
              <span className="font-mono text-[10px] text-signal">{credits === null ? "—" : credits}</span>
              <span className="font-mono text-[8px] tracking-[0.12em] text-zinc-600 uppercase">
                cr
              </span>
            </Link>

            <Link
              href="/dashboard/billing"
              className="hidden h-8 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 font-mono text-[9px] tracking-[0.12em] text-zinc-400 uppercase transition-colors hover:border-signal/25 hover:text-signal md:flex"
            >
              <span className="size-1 rounded-full bg-signal" />
              {credits === null ? "—" : credits} credits
            </Link>

            <Link
              href="/status"
              className="hidden h-8 items-center gap-1.5 rounded-full px-2.5 font-mono text-[9px] tracking-[0.12em] text-zinc-500 uppercase transition-colors hover:text-zinc-300 sm:flex"
            >
              Status
              <ArrowUpRightIcon className="size-3" />
            </Link>

            <Link
              href="/support"
              className="hidden size-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-200 sm:flex"
              aria-label="Help and support"
            >
              <CircleHelpIcon className="size-4" />
            </Link>

            <div className="hidden md:block">
              <UserMenu email={userEmail} plan={plan?.name ?? "Free"} compact />
            </div>

            <MobileWorkspaceMenu
              email={userEmail}
              credits={credits}
              plan={plan?.name ?? "Free"}
            />
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9 lg:py-10">
          {children}
        </main>

        <footer className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 border-t border-white/[0.05] px-4 py-5 font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-9">
          <span>© 2026 ClipMax · Studio</span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href="/privacy" className="transition-colors hover:text-zinc-400">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-zinc-400">
              Terms
            </Link>
            <Link href="/support" className="transition-colors hover:text-zinc-400">
              Support
            </Link>
          </span>
        </footer>
      </div>
    </div>
  );
}
