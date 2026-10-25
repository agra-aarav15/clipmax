import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SignupForm } from "@/components/auth/signup-form";
import { ClipMaxMark } from "@/components/brand/clipmax-mark";
import { dashboardNextPath } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Start clipping free",
  description:
    "Create your ClipMax studio. 30 free credits, 15-minute sources, and captioned 9:16 exports.",
};

const PROMISES = [
  "Hooks found by the pipeline, not guessed",
  "9:16 vertical exports, cropped for you",
  "Word-level captions, burned in",
] as const;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function readSourceLabel(source: string | null, intent: string | null): string | null {
  if (source) {
    try {
      return new URL(source).hostname.replace(/^www\./, "");
    } catch {
      return "Video link";
    }
  }

  if (intent === "upload") return "Upload selected";
  return null;
}

function readErrorMessage(error: string | null): string | null {
  if (error === "config") {
    return "Sign-in is not configured in this build. Add the Supabase keys to enable it.";
  }
  if (error === "auth") {
    return "That sign-in link is invalid or expired. Request a new one below.";
  }
  return null;
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const source = first(params.source);
  const intent = first(params.intent);
  const requestedNext = first(params.next);
  const mode = first(params.mode) === "signin" ? "signin" : "signup";
  const isSignin = mode === "signin";
  const error = first(params.error);

  const nextPath = dashboardNextPath({ source, intent, next: requestedNext });

  const switchParams = new URLSearchParams();
  switchParams.set("mode", isSignin ? "signup" : "signin");
  if (source) switchParams.set("source", source);
  if (intent) switchParams.set("intent", intent);
  if (requestedNext) switchParams.set("next", requestedNext);

  const sourceLabel = readSourceLabel(source, intent);
  const initialError = readErrorMessage(error);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#08090a]">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_78%_0%,rgba(21,94,239,0.22),transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_10%_60%,rgba(21,94,239,0.22),transparent_68%)]" />
        <div className="absolute inset-0 hero-dots [mask-image:linear-gradient(to_bottom,black,transparent_85%)] opacity-25" />
        <div className="absolute inset-0 film-grain opacity-[0.04] mix-blend-overlay" />
      </div>

      <header className="relative z-10 mx-auto flex h-[72px] w-full max-w-[1320px] shrink-0 items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="ClipMax home">
          <ClipMaxMark className="size-7 transition-transform duration-300 group-hover:-rotate-6" />
          <span className="text-[17px] font-semibold tracking-[-0.03em]">ClipMax</span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <span className="hidden font-mono text-[8px] tracking-[0.18em] text-zinc-500 uppercase sm:block">
            Studio
          </span>
        </Link>

        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.14em] text-zinc-500 uppercase transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3 transition-transform group-hover:-translate-x-0.5" />
          Back to site
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-[1320px] flex-1 gap-10 px-5 pt-6 pb-14 sm:px-8 sm:pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-12">
        <section className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[9px] tracking-[0.16em] text-zinc-300 uppercase backdrop-blur">
            <span className="size-1.5 rounded-full bg-signal" />
            The cutting room for long-form video
          </div>

          <p className="mt-7 max-w-[36rem] text-[clamp(2.5rem,4.2vw,4.2rem)] leading-[0.95] font-semibold tracking-[-0.06em] text-balance">
            Your next week of posts is{" "}
            <span className="font-serif text-[1.07em] font-normal tracking-[-0.03em] text-signal italic">
              already
            </span>{" "}
            in the recording.
          </p>

          <p className="mt-6 max-w-[31rem] text-[15px] leading-relaxed text-zinc-400">
            Upload the long version once. ClipMax finds the moments, crops to vertical, and burns
            the captions. You leave with a week of vertical clips and a much shorter to-do list.
          </p>

          <ul className="mt-8 space-y-3">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex items-center gap-2.5 text-[13px] text-zinc-300">
                <span className="grid size-5 shrink-0 place-items-center rounded-full border border-signal/25 bg-signal/[0.07]">
                  <CheckIcon className="size-3 text-signal" />
                </span>
                {promise}
              </li>
            ))}
          </ul>

          <div className="mt-10 border-t border-white/[0.07] pt-5">
            <p className="max-w-[27rem] font-serif text-[1.45rem] leading-snug text-zinc-400 italic">
              “The long version is the raw material. The clips are the product.”
            </p>
            <p className="mt-3 font-mono text-[8px] tracking-[0.16em] text-zinc-600 uppercase">
              ClipMax studio principles · 01
            </p>
          </div>
        </section>

        <section className="w-full max-w-[460px] justify-self-center lg:justify-self-end">
          <div className="mb-8 lg:hidden">
            <p className="text-[clamp(2.15rem,8vw,3.2rem)] leading-[0.95] font-semibold tracking-[-0.055em] text-balance">
              Long video in. A{" "}
              <span className="font-serif text-[1.06em] font-normal tracking-[-0.03em] text-signal italic">
                week
              </span>{" "}
              of clips out.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-zinc-500">
              Hooks found, frame cropped, captions burned. No timeline required.
            </p>
          </div>

          <SignupForm
            mode={mode}
            nextPath={nextPath}
            sourceLabel={sourceLabel}
            switchHref={`/signup?${switchParams.toString()}`}
            initialError={initialError}
          />
        </section>
      </main>

      <footer className="relative z-10 mt-auto border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase">
            © 2026 ClipMax · Private beta
          </span>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {[
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
              { href: "/refund", label: "Refunds" },
              { href: "/support", label: "Support" },
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
