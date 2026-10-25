import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-5">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_50%_10%,rgba(0,71,171,0.22),transparent_68%)]" />
        <div className="absolute inset-0 hero-dots opacity-20" />
      </div>
      <div className="relative max-w-md text-center">
        <p className="font-mono text-[9px] tracking-[0.2em] text-signal uppercase">404 · preview</p>
        <h1 className="mt-4 text-[clamp(2.2rem,6vw,3.6rem)] leading-[0.98] font-semibold tracking-[-0.05em]">
          That page is not in this build.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          The GitHub Pages deployment only contains the marketing preview. The studio, auth, and
          billing routes live in the full app.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-[13px] font-semibold text-primary-foreground transition-[filter] hover:brightness-105"
        >
          Back to the landing page
        </Link>
      </div>
    </main>
  );
}
