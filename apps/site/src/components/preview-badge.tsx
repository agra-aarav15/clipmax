const REPO_URL = "https://github.com/agra-aarav15/clipmax";

export function PreviewBadge() {
  return (
    <div className="fixed bottom-3 left-3 z-[80] flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-full border border-signal/25 bg-[#08090a]/90 px-3 py-1.5 font-mono text-[8px] tracking-[0.12em] text-zinc-400 uppercase shadow-[0_12px_40px_-18px_rgba(0,0,0,1)] backdrop-blur-xl sm:bottom-4 sm:left-4">
      <span className="size-1.5 shrink-0 rounded-full bg-signal" aria-hidden="true" />
      <span className="truncate">Static design preview</span>
      <span className="h-3 w-px shrink-0 bg-white/10" aria-hidden="true" />
      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 text-zinc-300 transition-colors hover:text-signal"
      >
        Source
      </a>
    </div>
  );
}
