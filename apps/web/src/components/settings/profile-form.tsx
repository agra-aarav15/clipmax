"use client";

import { CheckIcon, Loader2Icon, TriangleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileForm({
  initialDisplayName,
  email,
}: {
  initialDisplayName: string;
  email: string;
}) {
  const router = useRouter();
  const inputId = useId();
  const hintId = useId();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const trimmed = displayName.trim();
  const dirty = trimmed !== initialDisplayName;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: trimmed }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        setError(body?.error?.message ?? `Could not save the display name (${response.status}).`);
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check the connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label
          htmlFor={inputId}
          className="font-mono text-[8px] tracking-[0.16em] text-zinc-500 uppercase"
        >
          Display name
        </label>
        <Input
          id={inputId}
          name="displayName"
          value={displayName}
          maxLength={60}
          autoComplete="name"
          disabled={saving}
          onChange={(event) => {
            setDisplayName(event.target.value);
            setSaved(false);
            if (error) setError(null);
          }}
          aria-describedby={hintId}
          className="mt-2 h-11 rounded-xl border-white/10 bg-black/25"
        />
        <p id={hintId} className="mt-2 text-[11px] leading-relaxed text-zinc-600">
          Shown in the studio sidebar. Your sign-in email stays {email}.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={saving || !dirty || trimmed.length === 0}>
          {saving ? <Loader2Icon className="animate-spin" /> : null}
          {saving ? "Saving" : "Save name"}
        </Button>
        {saved ? (
          <span
            role="status"
            className="inline-flex items-center gap-1.5 font-mono text-[8px] tracking-[0.14em] text-signal uppercase"
          >
            <CheckIcon className="size-3" />
            Saved
          </span>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/[0.06] px-3 py-2.5 text-[11.5px] leading-relaxed text-red-200"
        >
          <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </form>
  );
}
