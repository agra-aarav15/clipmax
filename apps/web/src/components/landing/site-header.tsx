"use client";

import { ArrowUpRightIcon, MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ClipMaxMark } from "@/components/brand/clipmax-mark";
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
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "#preview", label: "Preview", index: "01" },
  { href: "#pipeline", label: "Workflow", index: "02" },
  { href: "#system", label: "System", index: "03" },
  { href: "#pricing", label: "Pricing", index: "04" },
] as const;

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
        scrolled
          ? "border-b border-white/[0.07] bg-[#08090a]/80 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <div className="mx-auto flex h-[72px] max-w-[1360px] items-center justify-between gap-5 px-5 sm:px-8">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label="ClipMax home"
        >
          <ClipMaxMark className="size-7 transition-transform duration-300 group-hover:-rotate-6" />
          <span className="text-[17px] font-semibold tracking-[-0.03em]">ClipMax</span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <span className="hidden font-mono text-[8px] tracking-[0.18em] text-zinc-500 uppercase sm:block">
            Studio
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center rounded-full border border-white/[0.08] bg-white/[0.025] p-1 backdrop-blur-xl lg:flex"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              <span className="font-mono text-[7px] text-zinc-600 transition-colors group-hover:text-signal/80">
                {item.index}
              </span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/signup?mode=signin"
            className="hidden h-9 items-center rounded-full px-3 text-[12px] text-zinc-400 transition-colors hover:text-white sm:flex"
          >
            Sign in
          </Link>

          <Link
            href="/signup"
            className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-[12px] font-semibold text-primary-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_10px_40px_-16px_rgba(0,71,171,0.65)] transition-[filter,transform] hover:brightness-105 active:scale-[0.99] sm:px-4"
          >
            <span className="hidden sm:inline">Start free</span>
            <span className="sm:hidden">Start</span>
            <ArrowUpRightIcon className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-full border-white/10 bg-white/[0.03] hover:bg-white/[0.06] lg:hidden"
                aria-label="Open navigation menu"
              >
                <MenuIcon className="size-4" />
              </Button>
            </DialogTrigger>

            <DialogContent
              showCloseButton={false}
              className="inset-0 top-0 left-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-0 bg-[#08090a]/98 p-0 shadow-none backdrop-blur-2xl sm:max-w-none"
            >
              <div className="relative flex h-dvh flex-col overflow-hidden">
                <div
                  className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
                  aria-hidden="true"
                >
                  <div className="absolute -top-24 -right-24 size-80 rounded-full bg-signal/[0.06] blur-[100px]" />
                  <div className="absolute -bottom-20 -left-20 size-72 rounded-full bg-signal/[0.05] blur-[100px]" />
                  <div className="absolute inset-0 hero-dots [mask-image:linear-gradient(to_bottom,black,transparent_80%)] opacity-20" />
                  <div className="absolute inset-0 film-grain opacity-[0.05] mix-blend-overlay" />
                </div>

                <DialogHeader className="flex h-[72px] flex-row items-center justify-between border-b border-white/[0.07] px-5">
                  <DialogTitle className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.02em]">
                    <ClipMaxMark className="size-6" />
                    ClipMax
                    <span className="font-mono text-[8px] font-normal tracking-[0.16em] text-zinc-500 uppercase">
                      Menu
                    </span>
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Navigate the ClipMax marketing site.
                  </DialogDescription>
                  <DialogClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                      aria-label="Close navigation menu"
                    >
                      <XIcon className="size-4" />
                    </Button>
                  </DialogClose>
                </DialogHeader>

                <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center px-5 py-8">
                  {NAV_ITEMS.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="group flex items-baseline justify-between border-b border-white/[0.07] py-5 first:border-t"
                    >
                      <span className="text-[clamp(2rem,10vw,3.25rem)] leading-none font-semibold tracking-[-0.055em] transition-colors group-hover:text-signal">
                        {item.label}
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.16em] text-zinc-600 transition-colors group-hover:text-signal">
                        {item.index}
                      </span>
                    </a>
                  ))}

                  <p className="mt-6 max-w-[18rem] text-[13px] leading-relaxed text-zinc-500">
                    One recording becomes a week of vertical clips. Hooks found, frame cropped,
                    captions burned.
                  </p>
                </nav>

                <div className="border-t border-white/[0.07] p-5">
                  <div className="flex flex-col gap-2">
                    <Button asChild className="h-12 w-full rounded-xl text-[14px]">
                      <Link href="/signup" onClick={() => setMenuOpen(false)}>
                        Start free
                        <ArrowUpRightIcon className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="h-12 w-full rounded-xl border-white/10 bg-white/[0.02] text-[14px]"
                    >
                      <Link href="/signup?mode=signin" onClick={() => setMenuOpen(false)}>
                        Sign in
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-4 flex items-center justify-between font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase">
                    <span className="flex items-center gap-1.5">
                      <span className="size-1 rounded-full bg-signal" />
                      Private beta · 30 free credits
                    </span>
                    <span>v0.1</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
