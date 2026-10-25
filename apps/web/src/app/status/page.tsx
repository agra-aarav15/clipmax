import { ActivityIcon, CircleCheckIcon, CircleDashedIcon, TriangleAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PublicPage } from "@/components/site/public-page";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Status",
  description:
    "Live configuration and worker status for the ClipMax private beta, with no invented uptime numbers.",
  alternates: { canonical: "/status" },
};

export const dynamic = "force-dynamic";

function has(...names: string[]): boolean {
  return names.every((name) => {
    const value = process.env[name];
    return typeof value === "string" && value.trim() !== "";
  });
}

type CheckState = "ok" | "missing" | "down";

type Check = {
  label: string;
  detail: string;
  state: CheckState;
  live: boolean;
};

type WorkerHealth = {
  status?: string;
  worker?: {
    started?: boolean;
    configured?: boolean;
    media_ready?: boolean;
    last_error?: string | null;
  };
};

async function workerCheck(): Promise<Check> {
  const url = process.env.WORKER_HEALTH_URL?.trim();
  if (!url) {
    return {
      label: "Render worker",
      detail:
        "No WORKER_HEALTH_URL is set for this deployment, so the worker cannot be probed from here.",
      state: "missing",
      live: false,
    };
  }

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      return {
        label: "Render worker",
        detail: `The worker health endpoint answered HTTP ${response.status}.`,
        state: "down",
        live: true,
      };
    }

    const body = (await response.json()) as WorkerHealth;
    const ready = body.worker?.started && body.worker?.configured && body.worker?.media_ready;

    return {
      label: "Render worker",
      detail: ready
        ? "The worker loop is running, configured, and FFmpeg is available."
        : `The worker answered, but is not fully ready.${body.worker?.last_error ? ` Last error: ${body.worker.last_error}` : ""}`,
      state: ready ? "ok" : "down",
      live: true,
    };
  } catch (error) {
    return {
      label: "Render worker",
      detail: `The worker health endpoint could not be reached: ${
        error instanceof Error ? error.message : "unknown network error"
      }.`,
      state: "down",
      live: true,
    };
  }
}

const STATE_LABEL: Record<CheckState, string> = {
  ok: "Operational",
  missing: "Not configured",
  down: "Needs attention",
};

const STATE_STYLE: Record<CheckState, string> = {
  ok: "border-signal/25 bg-signal/[0.06] text-signal",
  missing: "border-white/[0.09] bg-white/[0.025] text-zinc-400",
  down: "border-amber-300/25 bg-amber-300/[0.05] text-amber-200",
};

function StateIcon({ state }: { state: CheckState }) {
  if (state === "ok") return <CircleCheckIcon className="size-3.5" />;
  if (state === "down") return <TriangleAlertIcon className="size-3.5" />;
  return <CircleDashedIcon className="size-3.5" />;
}

export default async function StatusPage() {
  const worker = await workerCheck();

  const checks: Check[] = [
    {
      label: "Web application",
      detail: "This page was rendered by the running web process.",
      state: "ok",
      live: true,
    },
    {
      label: "Auth and database",
      detail: has("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY")
        ? has("SUPABASE_SERVICE_ROLE_KEY")
          ? "Supabase public and service-role credentials are present. This page does not query private tables."
          : "Public Supabase keys are present, but the service-role key is missing, so money and queue writes cannot run."
        : "Supabase credentials are not present in this process. Sign-in and studio data are unavailable.",
      state:
        has("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
        has("SUPABASE_SERVICE_ROLE_KEY")
          ? "ok"
          : "missing",
      live: false,
    },
    {
      label: "Private object storage",
      detail: has("R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET")
        ? "Cloudflare R2 credentials and a bucket name are present. Signed previews and downloads can be minted."
        : "Cloudflare R2 is not fully configured. Uploads, previews, and downloads are unavailable.",
      state: has("R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET") ? "ok" : "missing",
      live: false,
    },
    {
      label: "Billing",
      detail: has("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET")
        ? "Razorpay keys and the webhook secret are present. Credits are still granted only by a verified webhook."
        : "Razorpay is not fully configured. Checkout and subscription webhooks are closed.",
      state: has("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET")
        ? "ok"
        : "missing",
      live: false,
    },
    {
      label: "Free-credit renewal",
      detail: has("CRON_SECRET")
        ? "The cron secret is present, so the renewal route can be called by a scheduler."
        : "No CRON_SECRET is set. The monthly free-credit renewal route will reject every request.",
      state: has("CRON_SECRET") ? "ok" : "missing",
      live: false,
    },
    worker,
  ];

  const attention = checks.filter((check) => check.state !== "ok").length;
  const commit = process.env.GIT_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "local build";
  const checkedAt = new Date().toISOString();

  return (
    <PublicPage
      kicker="Status"
      title="What the process can"
      accent="actually prove."
      intro="This page reports credential presence and one live worker probe. It deliberately does not publish an uptime percentage or a fake incident history. If a dependency is not configured, it says so."
      updated={`Checked ${checkedAt} · Commit ${commit.slice(0, 12)}`}
    >
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl border p-4",
          attention === 0
            ? "border-signal/20 bg-signal/[0.04]"
            : "border-amber-300/20 bg-amber-300/[0.035]",
        )}
      >
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg border",
            attention === 0
              ? "border-signal/25 bg-signal/[0.08] text-signal"
              : "border-amber-300/25 bg-amber-300/[0.06] text-amber-200",
          )}
        >
          <ActivityIcon className="size-4" />
        </span>
        <div>
          <p className="text-[13px] font-medium text-zinc-100">
            {attention === 0
              ? "Every checked integration is configured."
              : `${attention} ${attention === 1 ? "check needs" : "checks need"} attention.`}
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-zinc-500">
            “Not configured” is not an outage. It means this deployment has not been given the
            credential, so the related feature is honestly closed.
          </p>
        </div>
      </div>

      <ul className="overflow-hidden rounded-2xl border border-white/[0.07]">
        {checks.map((check) => (
          <li
            key={check.label}
            className="flex flex-col gap-2 border-b border-white/[0.06] bg-[#0a0a0b] px-4 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
          >
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-zinc-200">
                {check.label}
                {check.live ? (
                  <span className="rounded border border-white/[0.08] px-1.5 py-0.5 font-mono text-[7px] tracking-[0.14em] text-zinc-500 uppercase">
                    live probe
                  </span>
                ) : (
                  <span className="rounded border border-white/[0.06] px-1.5 py-0.5 font-mono text-[7px] tracking-[0.14em] text-zinc-600 uppercase">
                    config
                  </span>
                )}
              </p>
              <p className="mt-1.5 max-w-2xl text-[11.5px] leading-relaxed text-zinc-500">
                {check.detail}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[8px] tracking-[0.12em] uppercase",
                STATE_STYLE[check.state],
              )}
            >
              <StateIcon state={check.state} />
              {STATE_LABEL[check.state]}
            </span>
          </li>
        ))}
      </ul>

      <section>
        <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-zinc-100">
          What this page does not claim
        </h2>
        <div className="mt-3 space-y-3 text-[13px] leading-[1.85] text-zinc-400">
          <p>
            Credential presence is not a live database query, a storage write test, or a Razorpay
            charge. The worker check is a real HTTP request only when{" "}
            <code className="rounded bg-white/[0.05] px-1 py-0.5 text-[11px] text-zinc-300">
              WORKER_HEALTH_URL
            </code>{" "}
            is set.
          </p>
          <p>
            For an outage or a failed render, open a{" "}
            <Link href="/support" className="text-signal underline-offset-4 hover:underline">
              support issue
            </Link>{" "}
            with the project id and error text. For the public marketing preview, see the{" "}
            <Link href="/" className="text-signal underline-offset-4 hover:underline">
              landing page
            </Link>
            .
          </p>
        </div>
      </section>
    </PublicPage>
  );
}
