import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";

const REPO_URL = "https://github.com/agra-aarav15/clipmax";

/**
 * Honest, in-flow preview notice. It sits above the page instead of floating over the
 * interface, so it never covers a heading, a control, or a sample clip.
 */
export function PreviewBar() {
  return (
    <div className="relative z-[60] border-b border-white/[0.06] bg-[#060708]">
      <div className="mx-auto flex h-8 w-full max-w-[1360px] items-center justify-between gap-3 px-5 font-mono text-[8px] tracking-[0.14em] text-zinc-500 uppercase sm:px-8">
        <span className="flex min-w-0 items-center gap-2">
          <span className="size-1.5 shrink-0 rounded-full bg-signal" aria-hidden="true" />
          <span className="truncate">Static design preview</span>
          <span className="hidden h-3 w-px shrink-0 bg-white/10 sm:block" aria-hidden="true" />
          <span className="hidden truncate text-zinc-600 sm:inline">
            The studio needs hosted credentials
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-3">
          <Link
            href="/directions"
            className="inline-flex items-center gap-1 text-zinc-400 transition-colors hover:text-signal"
          >
            Directions
          </Link>
          <span className="h-3 w-px bg-white/10" aria-hidden="true" />
          <Link
            href="/lab"
            className="inline-flex items-center gap-1 text-zinc-400 transition-colors hover:text-signal"
          >
            Lab
          </Link>
          <span className="h-3 w-px bg-white/10" aria-hidden="true" />
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-zinc-400 transition-colors hover:text-signal"
          >
            Source
            <ArrowUpRightIcon className="size-2.5" aria-hidden="true" />
          </a>
        </span>
      </div>
    </div>
  );
}
