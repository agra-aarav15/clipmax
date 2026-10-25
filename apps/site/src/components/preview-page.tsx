import { ArrowLeftIcon, ArrowUpRightIcon, CheckIcon, MinusIcon } from "lucide-react";
import Link from "next/link";

import { ClipMaxMark } from "../../../web/src/components/brand/clipmax-mark";

const REPO_URL = "https://github.com/agra-aarav15/clipmax";
const RUNBOOK_URL = `${REPO_URL}/blob/main/docs/runbook.md`;

const NEEDS_APP = [
  "Sign-in (Supabase Auth)",
  "Direct-to-R2 uploads",
  "The FFmpeg worker pipeline",
  "Credits and Razorpay checkout",
] as const;

export function PreviewPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_78%_0%,rgba(0,71,171,0.22),transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_10%_60%,rgba(0,71,171,0.18),transparent_68%)]" />
        <div className="absolute inset-0 hero-dots opacity-20 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="absolute inset-0 film-grain opacity-[0.04] mix-blend-overlay" />
      </div>

      <header className="relative z-10 mx-auto flex h-[72px] w-full max-w-[1320px] shrink-0 items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="ClipMax home">
          <ClipMaxMark className="size-7 transition-transform duration-300 group-hover:-rotate-6" />
          <span className="text-[17px] font-semibold tracking-[-0.03em]">ClipMax</span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <span className="hidden font-mono text-[8px] tracking-[0.18em] text-zinc-500 uppercase sm:block">
            Preview
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

      <main className="relative z-10 mx-auto grid w-full max-w-[1040px] flex-1 gap-10 px-5 pt-10 pb-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section>
          <span className="inline-flex items-center gap-2 rounded-full border border-signal/25 bg-signal/[0.06] px-3 py-1.5 font-mono text-[8px] tracking-[0.16em] text-signal uppercase">
            <span className="size-1.5 rounded-full bg-signal" />
            {eyebrow}
          </span>

          <h1 className="mt-6 max-w-[16ch] text-[clamp(2.3rem,5vw,4rem)] leading-[0.96] font-semibold tracking-[-0.06em] text-balance">
            {title}
          </h1>

          <p className="mt-5 max-w-[34rem] text-[15px] leading-relaxed text-pretty text-zinc-400">
            {description}
          </p>

          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[13px] font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-105 active:scale-[0.99]"
            >
              Explore the landing page
              <ArrowUpRightIcon className="size-4" aria-hidden="true" />
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 text-[13px] text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              Open the repository
              <ArrowUpRightIcon className="size-4" aria-hidden="true" />
            </a>
          </div>

          <p className="mt-5 max-w-[34rem] text-[11px] leading-relaxed text-zinc-600">
            This is a static GitHub Pages build. It intentionally has no fake sign-in, sample
            project, or simulated payment. Those flows run only when the full app is configured with
            real Supabase and R2 credentials.
          </p>
        </section>

        <aside className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
          <p className="font-mono text-[8px] tracking-[0.16em] text-zinc-500 uppercase">
            What this preview includes
          </p>
          <ul className="mt-4 space-y-2.5">
            {["The full landing page", "Responsive layout at every width", "Reduced-motion-safe animation"].map(
              (item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] text-zinc-300">
                  <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-signal" aria-hidden="true" />
                  {item}
                </li>
              ),
            )}
          </ul>

          <p className="mt-6 border-t border-white/[0.07] pt-4 font-mono text-[8px] tracking-[0.16em] text-zinc-500 uppercase">
            Needs the full app
          </p>
          <ul className="mt-3 space-y-2">
            {NEEDS_APP.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[12px] text-zinc-500">
                <MinusIcon className="mt-0.5 size-3.5 shrink-0 text-zinc-600" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>

          <a
            href={RUNBOOK_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-1.5 border-t border-white/[0.07] pt-4 font-mono text-[8px] tracking-[0.14em] text-zinc-500 uppercase transition-colors hover:text-signal"
          >
            Read the deployment runbook
            <ArrowUpRightIcon className="size-3" aria-hidden="true" />
          </a>
        </aside>
      </main>

      <footer className="relative z-10 mt-auto border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-2 px-5 py-4 font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© 2026 ClipMax</span>
          <span>Static design preview · Full studio requires hosted credentials</span>
        </div>
      </footer>
    </div>
  );
}
