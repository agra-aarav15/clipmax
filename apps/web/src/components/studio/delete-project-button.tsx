"use client";

import { Loader2Icon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {
    // fall through
  }
  return `Could not delete the project (${response.status}).`;
}

export function DeleteProjectButton({ projectId, title }: { projectId: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    const confirmed = window.confirm(
      `Delete “${title}”? This removes the source, its transcript, and every rendered clip. This cannot be undone.`,
    );
    if (!confirmed) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });

      if (!response.ok) {
        setError(await errorMessage(response));
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The delete request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-destructive hover:underline disabled:opacity-50"
      >
        {busy ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <Trash2Icon className="size-3.5" />
        )}
        {busy ? "Deleting" : "Delete project"}
      </button>
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
