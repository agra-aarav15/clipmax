"use client";

import { CheckCircle2Icon, XIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

/** Confirms a completed account deletion without making the static landing page dynamic. */
export function AccountDeletedNotice() {
  const params = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  if (params.get("deleted") !== "1" || dismissed) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-[80] mx-auto flex max-w-xl items-start gap-3 rounded-xl border border-signal/25 bg-[#0b1218]/95 px-4 py-3 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:inset-x-auto sm:right-6 sm:left-auto"
    >
      <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-signal" />
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-zinc-100">Account deleted.</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">
          The profile, projects, clips, transcripts, credits, and stored objects were removed.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="grid size-7 shrink-0 place-items-center rounded-md text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"
        aria-label="Dismiss"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  );
}
