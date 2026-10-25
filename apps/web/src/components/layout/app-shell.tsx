import { LogInIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ClipMaxMark } from "@/components/brand/clipmax-mark";
import { WorkspaceNav } from "@/components/layout/workspace-nav";
import { Badge } from "@/components/ui/badge";

export function AppShell({
  children,
  configured,
  userEmail,
  credits,
}: {
  children: ReactNode;
  configured: boolean;
  userEmail: string | null;
  credits: number | null;
}) {
  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <ClipMaxMark />
          <Link href="/" className="text-[0.8125rem] font-semibold tracking-[0.22em]">
            CLIPMAX
          </Link>
        </div>

        <div className="px-4 pt-5">
          <Link
            href="/dashboard#new-project"
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <PlusIcon className="size-4" />
            New project
          </Link>
        </div>

        <nav className="flex-1 px-3 py-5" aria-label="Primary">
          <p className="px-3 pb-2 text-[0.625rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Workspace
          </p>
          <WorkspaceNav />
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-lg border border-sidebar-border bg-background/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.625rem] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                Credits
              </span>
              <Badge variant="outline" className="border-signal/30 font-mono text-signal">
                {credits === null ? "—" : credits}
              </Badge>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {configured
                ? "1 credit per minute of source. Unused credits are refunded after the probe."
                : "Connect Supabase to show a real wallet balance."}
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border/70 px-4 md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <ClipMaxMark className="size-5" />
            <span className="text-xs font-semibold tracking-[0.2em]">CLIPMAX</span>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
            <span>Studio</span>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">Dashboard</span>
          </div>

          <div className="flex min-w-0 items-center gap-3">
            {credits !== null ? (
              <span className="hidden rounded-full border border-signal/20 bg-signal/[0.06] px-2.5 py-1 font-mono text-[0.6875rem] text-signal sm:inline-flex">
                {credits} credits
              </span>
            ) : null}
            {userEmail ? (
              <span className="hidden max-w-52 truncate text-xs text-muted-foreground sm:inline">
                {userEmail}
              </span>
            ) : null}
            {userEmail ? (
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Sign out
                </button>
              </form>
            ) : (
              <Link
                href="/signup?next=/dashboard"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                <LogInIcon className="size-3.5" />
                Sign in
              </Link>
            )}
          </div>
        </header>

        <div className="border-b border-border/70 px-4 py-2 md:hidden">
          <WorkspaceNav variant="mobile" />
        </div>

        <main className="flex-1 px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
