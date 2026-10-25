"use client";

import { Loader2Icon, RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {
    // fall through
  }
  return `Could not retry the project (${response.status}).`;
}

export function RetryProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retry() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/retry`, { method: "POST" });

      if (!response.ok) {
        setError(await errorMessage(response));
        return;
      }

      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The retry request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" size="sm" onClick={retry} disabled={busy}>
        {busy ? <Loader2Icon className="animate-spin" /> : <RotateCcwIcon />}
        {busy ? "Re-queuing" : "Retry project"}
      </Button>
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-1.5 text-xs leading-relaxed text-destructive"
        >
          <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
