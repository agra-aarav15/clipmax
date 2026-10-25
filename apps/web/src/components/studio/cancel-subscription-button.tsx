"use client";

import { Loader2Icon, TriangleAlertIcon, XCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CancelSubscriptionButton({
  periodEnd,
  scheduled,
}: {
  periodEnd: string | null;
  scheduled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (scheduled) {
    return (
      <div className="rounded-lg border border-amber-300/20 bg-amber-300/[0.04] px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-100/85">
        Cancellation is scheduled
        {periodEnd ? ` for ${new Date(periodEnd).toLocaleDateString("en-GB")}` : ""}. Future charges
        stop; credits stay usable until then.
      </div>
    );
  }

  async function cancel() {
    const confirmed = window.confirm(
      "Cancel the Starter subscription? Future charges stop at the end of the current period. Credits already granted stay in the wallet.",
    );
    if (!confirmed) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/cancel", { method: "POST" });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        setError(body?.error?.message ?? `Could not cancel the subscription (${response.status}).`);
        return;
      }

      router.refresh();
    } catch {
      setError("Could not reach the server. Nothing was cancelled.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-white/10"
        disabled={busy}
        onClick={cancel}
      >
        {busy ? <Loader2Icon className="animate-spin" /> : <XCircleIcon />}
        {busy ? "Cancelling" : "Cancel subscription"}
      </Button>
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/[0.07] px-3 py-2 text-[11.5px] leading-relaxed text-red-200"
        >
          <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
