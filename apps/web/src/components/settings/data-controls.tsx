"use client";

import {
  DownloadIcon,
  Loader2Icon,
  LogOutIcon,
  ShieldAlertIcon,
  TriangleAlertIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CANCELABLE = new Set(["active", "pending", "past_due", "paused"]);

export function DataControls({
  subscriptionStatus,
  cancelAtPeriodEnd,
  periodEnd,
}: {
  subscriptionStatus: string | null;
  cancelAtPeriodEnd: boolean;
  periodEnd: string | null;
}) {
  const router = useRouter();
  const confirmId = useId();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blocked = Boolean(subscriptionStatus && CANCELABLE.has(subscriptionStatus));

  async function removeAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (confirmation !== "DELETE") {
      setError('Type DELETE in capitals to confirm.');
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        setError(body?.error?.message ?? `Could not delete the account (${response.status}).`);
        return;
      }

      router.push("/?deleted=1");
      router.refresh();
    } catch {
      setError("Could not reach the server. The account was not deleted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[13px] font-medium text-zinc-200">Export account data</p>
          <p className="mt-1 max-w-lg text-[11.5px] leading-relaxed text-zinc-500">
            A JSON archive of your profile, projects, clips, transcripts, jobs, subscription, and
            credit ledger. No card data is included because ClipMax never stores it.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="border-white/10">
          <a href="/api/account/export" download>
            <DownloadIcon />
            Download JSON
          </a>
        </Button>
      </div>

      <div className="rounded-xl border border-destructive/20 bg-destructive/[0.035] p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-destructive/25 bg-destructive/10">
            <ShieldAlertIcon className="size-4 text-red-300" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-red-100">Delete this account</p>
            <p className="mt-1 max-w-xl text-[11.5px] leading-relaxed text-red-200/65">
              Removes the profile, every project, source object, transcript, clip, job, credit row,
              and subscription record. This cannot be undone.
            </p>

            {blocked ? (
              <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/[0.04] px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-100/85">
                {cancelAtPeriodEnd ? (
                  <>
                    Your subscription is scheduled to end
                    {periodEnd ? ` on ${new Date(periodEnd).toLocaleDateString("en-GB")}` : ""}.
                    Account deletion unlocks after Razorpay reports it cancelled, so a closed
                    account cannot keep being charged.
                  </>
                ) : (
                  <>
                    Cancel the subscription in{" "}
                    <Link
                      href="/dashboard/billing"
                      className="text-amber-100 underline underline-offset-4"
                    >
                      Billing
                    </Link>{" "}
                    first. Razorpay could otherwise keep charging an account that no longer exists.
                  </>
                )}
              </div>
            ) : open ? (
              <form onSubmit={removeAccount} className="mt-4 space-y-3">
                <label
                  htmlFor={confirmId}
                  className="block font-mono text-[8px] tracking-[0.16em] text-red-200/70 uppercase"
                >
                  Type DELETE to confirm
                </label>
                <Input
                  id={confirmId}
                  value={confirmation}
                  onChange={(event) => {
                    setConfirmation(event.target.value);
                    if (error) setError(null);
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={busy}
                  className="h-10 max-w-[16rem] rounded-lg border-destructive/30 bg-black/30 font-mono tracking-[0.2em]"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    disabled={busy || confirmation !== "DELETE"}
                  >
                    {busy ? <Loader2Icon className="animate-spin" /> : null}
                    {busy ? "Deleting" : "Delete account permanently"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      setOpen(false);
                      setConfirmation("");
                      setError(null);
                    }}
                  >
                    Keep account
                  </Button>
                </div>
                {error ? (
                  <p
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/[0.08] px-3 py-2 text-[11.5px] leading-relaxed text-red-200"
                  >
                    <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
                    {error}
                  </p>
                ) : null}
              </form>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 border-destructive/30 text-red-200 hover:border-destructive/50 hover:bg-destructive/10"
                onClick={() => setOpen(true)}
              >
                Delete account
              </Button>
            )}
          </div>
        </div>
      </div>

      <form action="/auth/signout" method="post">
        <Button type="submit" variant="ghost" size="sm" className="text-zinc-400">
          <LogOutIcon />
          Sign out of this device
        </Button>
      </form>
    </div>
  );
}
