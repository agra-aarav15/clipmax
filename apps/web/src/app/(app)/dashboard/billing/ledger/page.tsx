import {
  ArrowDownLeftIcon,
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CoinsIcon,
  DownloadIcon,
  ReceiptTextIcon,
  WalletIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StudioConfigurationState } from "@/components/studio/configuration-state";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { getCurrentUser } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Credit ledger",
  robots: { index: false, follow: false },
};

const REQUIRED_STUDIO_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const REASON_LABELS: Record<string, string> = {
  grant_signup: "Signup grant",
  grant_monthly: "Monthly grant",
  grant_purchase: "Starter purchase",
  debit_project: "Project reservation",
  refund_project: "Project refund",
  admin_adjustment: "Adjustment",
};

type LedgerRow = {
  id: string;
  delta: number;
  reason: string;
  project_id: string | null;
  idempotency_key: string;
  metadata: { stage?: string; actual_credits?: number } | null;
  created_at: string;
};

type WalletRow = { balance: number };

export default async function LedgerPage() {
  const { supabase, user } = await getCurrentUser();

  if (!supabase) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-[9px] tracking-[0.2em] text-signal uppercase">Billing</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
          The ledger is not connected.
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-zinc-400">
          Add the Supabase credentials to read the real append-only credit ledger.
        </p>
        <div className="mt-8">
          <StudioConfigurationState keys={REQUIRED_STUDIO_KEYS} />
        </div>
      </div>
    );
  }

  if (!user) redirect("/signup?next=/dashboard/billing/ledger&mode=signin");

  const [{ data: wallet, error: walletError }, { data: ledger, error: ledgerError }] =
    await Promise.all([
      supabase
        .from("credit_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle<WalletRow>(),
      supabase
        .from("credit_ledger")
        .select("id, delta, reason, project_id, idempotency_key, metadata, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1000)
        .returns<LedgerRow[]>(),
    ]);

  const rows = ledger ?? [];
  const balance = typeof wallet?.balance === "number" ? wallet.balance : null;
  const granted = rows.filter((row) => row.delta > 0).reduce((sum, row) => sum + row.delta, 0);
  const spent = rows.filter((row) => row.delta < 0).reduce((sum, row) => sum + row.delta, 0);
  const refunded = rows
    .filter((row) => row.reason === "refund_project" && row.delta > 0)
    .reduce((sum, row) => sum + row.delta, 0);
  const errors = [walletError, ledgerError].filter((error): error is NonNullable<typeof error> =>
    Boolean(error),
  );

  return (
    <div className="mx-auto max-w-[1180px]">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2">
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1.5 font-mono text-[8.5px] tracking-[0.14em] text-zinc-500 uppercase transition-colors hover:text-zinc-200"
        >
          <ArrowLeftIcon className="size-3" />
          Billing
        </Link>
        <span aria-hidden="true" className="text-zinc-700">
          /
        </span>
        <span className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
          Ledger
        </span>
      </nav>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="font-mono text-[9px] tracking-[0.2em] text-signal uppercase">
            Credit ledger
          </p>
          <h1 className="mt-3 text-[clamp(2rem,4vw,3.2rem)] leading-[0.98] font-semibold tracking-[-0.06em]">
            Every credit,{" "}
            <span className="font-serif text-[1.06em] font-normal tracking-[-0.03em] text-signal italic">
              on the record.
            </span>
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
            Append-only rows written by database functions. The wallet balance is a cache of this
            history; a reservation, settlement, and refund are separate, auditable events.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="border-white/10">
          <a href="/api/billing/ledger/export" download>
            <DownloadIcon />
            Export CSV
          </a>
        </Button>
      </div>

      {errors.length > 0 ? (
        <div
          role="status"
          className="mt-6 rounded-xl border border-destructive/25 bg-destructive/[0.06] px-3.5 py-3 text-[11.5px] leading-relaxed text-red-200"
        >
          Some ledger data could not be loaded: {errors.map((error) => error.message).join(" · ")}
        </div>
      ) : null}

      <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.05] sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Current balance",
            value: balance === null ? "—" : String(balance),
            icon: WalletIcon,
            tone: "text-signal",
          },
          {
            label: "Granted (loaded)",
            value: `+${granted}`,
            icon: ArrowDownLeftIcon,
            tone: "text-signal",
          },
          {
            label: "Reserved (loaded)",
            value: String(spent),
            icon: ArrowUpRightIcon,
            tone: "text-zinc-200",
          },
          {
            label: "Refunded (loaded)",
            value: `+${refunded}`,
            icon: ReceiptTextIcon,
            tone: "text-signal",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-[#0a0a0b] px-4 py-4">
              <dt className="flex items-center gap-2 font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase">
                <Icon className={cn("size-3.5", item.tone)} />
                {item.label}
              </dt>
              <dd
                className={cn(
                  "mt-2 font-mono text-[1.55rem] leading-none tracking-[-0.04em]",
                  item.tone,
                )}
              >
                {item.value}
              </dd>
            </div>
          );
        })}
      </dl>

      <section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0a0b]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            <CoinsIcon className="size-3.5 text-signal" />
            <h2 className="text-[12.5px] font-medium text-zinc-200">All entries</h2>
          </div>
          <span className="font-mono text-[8px] tracking-[0.12em] text-zinc-600 uppercase">
            {rows.length >= 1000 ? "Latest 1,000 · export for all" : `${rows.length} entries`}
          </span>
        </div>

        {rows.length > 0 ? (
          <ul className="divide-y divide-white/[0.05]">
            {rows.map((row) => (
              <li
                key={row.id}
                className="grid gap-2 px-4 py-3.5 transition-colors hover:bg-white/[0.015] sm:grid-cols-[minmax(0,1fr)_140px_100px] sm:items-center sm:gap-4 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[12px] text-zinc-200">
                    {REASON_LABELS[row.reason] ?? row.reason}
                    {row.metadata?.stage ? (
                      <span className="rounded border border-white/[0.07] px-1.5 py-0.5 font-mono text-[7px] tracking-[0.12em] text-zinc-600 uppercase">
                        {row.metadata.stage}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 font-mono text-[8px] tracking-[0.08em] text-zinc-600">
                    {formatDateTime(row.created_at)}
                    {row.project_id ? (
                      <>
                        {" · "}
                        <Link
                          href={`/dashboard/projects/${row.project_id}`}
                          className="underline-offset-4 hover:text-signal hover:underline"
                        >
                          project {row.project_id.slice(0, 8)}
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>

                <p className="font-mono text-[8px] tracking-[0.06em] text-zinc-600 sm:text-right">
                  {row.idempotency_key.length > 34
                    ? `${row.idempotency_key.slice(0, 34)}…`
                    : row.idempotency_key}
                </p>

                <p
                  className={cn(
                    "font-mono text-[13px] tabular sm:text-right",
                    row.delta > 0 ? "text-signal" : "text-zinc-200",
                  )}
                >
                  {row.delta > 0 ? "+" : ""}
                  {row.delta}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-14 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-full border border-signal/20 bg-signal/[0.05]">
              <CoinsIcon className="size-4 text-signal" />
            </span>
            <p className="mt-4 text-[13px] font-medium text-zinc-200">No credit activity yet.</p>
            <p className="mx-auto mt-1 max-w-sm text-[11.5px] leading-relaxed text-zinc-500">
              The signup grant appears after the profile trigger runs. Starting a project creates
              the first reservation.
            </p>
          </div>
        )}
      </section>

      <p className="mt-4 text-[11px] leading-relaxed text-zinc-600">
        A project can hold one reservation at a time. A retry takes a fresh reservation after the
        previous one is refunded. See{" "}
        <Link href="/refund" className="text-signal underline-offset-4 hover:underline">
          how refunds work
        </Link>
        .
      </p>
    </div>
  );
}
