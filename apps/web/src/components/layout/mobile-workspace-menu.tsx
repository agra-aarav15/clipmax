"use client";

import { ArrowUpRightIcon, MenuIcon, PlusIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ClipMaxMark } from "@/components/brand/clipmax-mark";
import { WorkspaceNav } from "@/components/layout/workspace-nav";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function MobileWorkspaceMenu({
  email,
  credits,
  plan,
}: {
  email: string | null;
  credits: number | null;
  plan: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-lg border-white/10 bg-white/[0.03] md:hidden"
          aria-label="Open workspace menu"
        >
          <MenuIcon className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="inset-0 top-0 left-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-0 bg-[#08090a] p-0 shadow-none sm:max-w-none"
      >
        <div className="relative flex h-dvh flex-col">
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
            <div className="absolute -top-24 -right-20 size-72 rounded-full bg-primary/20 blur-[110px]" />
            <div className="absolute inset-0 hero-dots opacity-[0.12]" />
            <div className="absolute inset-0 film-grain opacity-[0.04] mix-blend-overlay" />
          </div>

          <DialogHeader className="flex h-[68px] shrink-0 flex-row items-center justify-between border-b border-white/[0.07] px-4">
            <DialogTitle className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.02em]">
              <ClipMaxMark className="size-6" />
              ClipMax
            </DialogTitle>
            <DialogDescription className="sr-only">
              Navigate the ClipMax studio and account.
            </DialogDescription>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                aria-label="Close workspace menu"
              >
                <XIcon className="size-4" />
              </Button>
            </DialogClose>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
            <Button asChild className="h-11 w-full rounded-xl text-[13px]">
              <Link href="/dashboard#new-project" onClick={() => setOpen(false)}>
                <PlusIcon className="size-4" />
                New project
              </Link>
            </Button>

            <div className="mt-6">
              <WorkspaceNav variant="mobile" onNavigate={() => setOpen(false)} />
            </div>

            <div className="mt-7 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[8px] tracking-[0.18em] text-zinc-500 uppercase">
                  Credit balance
                </p>
                <span className="rounded-full border border-signal/20 bg-signal/[0.06] px-2 py-0.5 font-mono text-[8px] tracking-[0.12em] text-signal uppercase">
                  {plan}
                </span>
              </div>
              <p className="mt-2 font-mono text-3xl tracking-tight text-white">
                {credits === null ? "—" : credits}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                One credit is one minute of source video.
              </p>
              <Link
                href="/dashboard/billing"
                onClick={() => setOpen(false)}
                className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-signal"
              >
                Manage plan & credits
                <ArrowUpRightIcon className="size-3" />
              </Link>
            </div>
          </div>

          <div className="shrink-0 border-t border-white/[0.07] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[12px] text-zinc-300">{email ?? "Not signed in"}</p>
                <p className="font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase">
                  Studio session
                </p>
              </div>
              <form action="/auth/signout" method="post">
                <Button type="submit" variant="outline" size="sm" className="border-white/10">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
