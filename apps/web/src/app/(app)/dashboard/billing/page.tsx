import { PLAN_CATALOG, formatPlanPrice, getPlan, type PlanTier } from "@clipmax/shared";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CheckIcon,
  CoinsIcon,
  CreditCardIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
  WalletIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CancelSubscriptionButton } from "@/components/studio/cancel-subscription-button";
import { StudioConfigurationState } from "@/components/studio/configuration-state";
import { UpgradeButton } from "@/components/studio/upgrade-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getBillingConfig, MISSING_BILLING_ENV } from "@/lib/payments/config";
import { getCurrentUser } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Billing",
  robots: { index: false, follow: false },
};

const REQUIRED_STUDIO_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const SUBSCRIPTION_LABELS: Record<string, string> = {
  active: "Active",
  pending: "Checkout pending",
  past_due: "Payment past due",
  paused: "Paused",
  canceled: "Canceled",
  completed: "Completed",
};

const REASON_LABELS: Record<string, string> = {
  grant_signup: "Signup grant",
  grant_monthly: "Monthly grant",
  grant_purchase: "Starter purchase",
  debit_project: "Project reservation",
  refund_project: "Project refund",
  admin_adjustment: "Adjustment",
};

type ProfileRow = { plan: string };
type WalletRow = { balance: number };
type SubscriptionRow = {
  status: string;
  plan: string;
  provider: string;
  provider_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};
type LedgerRow = {
  id: string;
  delta: number;
  reason: string;
  created_at: string;
};

export default async function BillingPage() {
  const { supabase, user } = await getCurrentUser();

  if (!supabase) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="font-mono text-[0.625rem] tracking-[0.2em] text-signal uppercase">
            Billing
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Billing is not connected.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Add the Supabase credentials to load the real plan, wallet, and ledger. No balance is
            invented for the preview.
          </p>
        </div>
        <StudioConfigurationState keys={REQUIRED_STUDIO_KEYS} />
      </div>
    );
  }

  if (!user) redirect("/signup?next=/dashboard/billing");

  const [
    { data: profile, error: profileError },
    { data: wallet, error: walletError },
    { data: subscription, error: subscriptionError },
    { data: ledger, error: ledgerError },
  ] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle<ProfileRow>(),
    supabase
      .from("credit_wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle<WalletRow>(),
    supabase
      .from("subscriptions")
      .select(
        "status, plan, provider, provider_subscription_id, current_period_end, cancel_at_period_end",
      )
      .eq("user_id", user.id)
      .maybeSingle<SubscriptionRow>(),
    supabase
      .from("credit_ledger")
      .select("id, delta, reason, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<LedgerRow[]>(),
  ]);

  const planTier = (profile?.plan ?? "free") as PlanTier;
  const plan = getPlan(planTier) ?? PLAN_CATALOG.free;
  const starter = PLAN_CATALOG.starter;
  const credits = typeof wallet?.balance === "number" ? wallet.balance : null;
  const billing = getBillingConfig();
  const subscriptionStatus = subscription?.status ?? "none";
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const activeStarter = subscription?.status === "active";
  const cancelScheduled = Boolean(subscription?.cancel_at_period_end);
  const loadErrors = [profileError, walletError, subscriptionError, ledgerError].filter(
    (error): error is NonNullable<typeof error> => Boolean(error),
  );

  if (loadErrors.length > 0) {
    // Keep provider details in server logs; do not surface raw Postgres/Supabase messages.
    console.error(
      "[billing] billing data failed to load",
      loadErrors.map((error) => ({ code: error.code, message: error.message })),
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-muted-foreground"
      >
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          Studio
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">Billing</span>
      </nav>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.625rem] tracking-[0.2em] text-signal uppercase">
            Billing &amp; credits
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">The meter, in the open.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            One credit buys one minute of source video. The wallet is a cached balance; every change
            is an append-only ledger row.
          </p>
        </div>
        {billing?.testMode ? (
          <Badge variant="outline" className="border-amber-300/30 text-amber-200">
            Razorpay test mode
          </Badge>
        ) : null}
      </div>

      {loadErrors.length > 0 ? (
        <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            Some billing data could not be loaded. No payment was taken. Refresh to try again, or
            check the{" "}
            <Link href="/status" className="underline underline-offset-4 hover:text-white">
              service status
            </Link>
            .
          </span>
        </div>
      ) : null}

      <dl className="mt-8 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-background px-4 py-4">
          <dt className="flex items-center gap-2 text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">
            <CreditCardIcon className="size-3.5 text-signal" />
            Plan
          </dt>
          <dd className="mt-1 text-lg font-medium">{plan.name}</dd>
        </div>
        <div className="bg-background px-4 py-4">
          <dt className="flex items-center gap-2 text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">
            <WalletIcon className="size-3.5 text-signal" />
            Credits
          </dt>
          <dd className="mt-1 font-mono text-2xl">{credits === null ? "—" : credits}</dd>
        </div>
        <div className="bg-background px-4 py-4">
          <dt className="flex items-center gap-2 text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">
            <ReceiptTextIcon className="size-3.5 text-signal" />
            Subscription
          </dt>
          <dd className="mt-1 text-sm font-medium">
            {SUBSCRIPTION_LABELS[subscriptionStatus] ?? "None"}
          </dd>
        </div>
        <div className="bg-background px-4 py-4">
          <dt className="text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">
            Current period ends
          </dt>
          <dd className="mt-1 text-sm font-medium">
            {periodEnd ? formatDate(periodEnd.toISOString()) : "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b border-border/70 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>
                  {activeStarter
                    ? cancelScheduled
                      ? "Starter ends at the period close"
                      : "Starter is active"
                    : "Upgrade to Starter"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {activeStarter
                    ? cancelScheduled
                      ? "No further charges are scheduled. Credits already granted stay in the wallet."
                      : "Your subscription renews in Razorpay. Credits arrive on every successful charge."
                    : "150 credits every month, charged as ₹1,499 / month through Razorpay."}
                </CardDescription>
              </div>
              {activeStarter ? (
                <Badge
                  variant="outline"
                  className={cn(
                    cancelScheduled
                      ? "border-amber-300/30 text-amber-200"
                      : "border-signal/30 text-signal",
                  )}
                >
                  {cancelScheduled ? "Cancels soon" : "Active"}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="py-5">
            <div className="flex items-end gap-2">
              <span className="text-[2.25rem] leading-none font-semibold tracking-[-0.05em]">
                {formatPlanPrice(starter.price, "USD")}
              </span>
              <span className="pb-1 font-mono text-[0.625rem] tracking-[0.1em] text-muted-foreground uppercase">
                / month
              </span>
            </div>
            <p className="mt-1 font-mono text-[0.625rem] tracking-[0.08em] text-muted-foreground">
              {formatPlanPrice(starter.price, "INR")} / month via Razorpay
            </p>

            <ul className="mt-5 space-y-2.5">
              {starter.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-signal" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-border/70 pt-5">
              {activeStarter ? (
                <div className="space-y-3">
                  <CancelSubscriptionButton
                    periodEnd={subscription?.current_period_end ?? null}
                    scheduled={cancelScheduled}
                  />
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Cancelling stops future charges at the end of the current period. It does not
                    remove credits already in the wallet. Deletion is available in{" "}
                    <Link
                      href="/dashboard/settings"
                      className="text-signal underline-offset-4 hover:underline"
                    >
                      Settings
                    </Link>{" "}
                    after the subscription ends.
                  </p>
                </div>
              ) : billing ? (
                <div className="space-y-3">
                  {subscriptionStatus === "pending" ? (
                    <p className="rounded-md border border-amber-300/20 bg-amber-300/[0.04] px-3 py-2 text-xs leading-relaxed text-amber-200">
                      A checkout was started but no successful charge is recorded yet. Finish the
                      payment or start a fresh checkout.
                    </p>
                  ) : null}
                  {subscriptionStatus === "past_due" || subscriptionStatus === "paused" ? (
                    <p className="rounded-md border border-amber-300/20 bg-amber-300/[0.04] px-3 py-2 text-xs leading-relaxed text-amber-200">
                      Razorpay reports this subscription as{" "}
                      {SUBSCRIPTION_LABELS[subscriptionStatus]?.toLowerCase()}. A fresh checkout is
                      allowed, and the old subscription will not grant new credits.
                    </p>
                  ) : null}
                  <UpgradeButton
                    email={user.email ?? null}
                    testMode={billing.testMode}
                    label={
                      subscriptionStatus === "none" ? "Upgrade to Starter" : "Start a new checkout"
                    }
                  />
                  <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
                    Razorpay charges in INR. Credits are granted by the verified webhook, never by
                    this browser.
                  </p>
                </div>
              ) : (
                <StudioConfigurationState
                  keys={MISSING_BILLING_ENV}
                  title="Billing is not connected"
                  description="Checkout stays closed until the Razorpay keys, the Starter plan id, and the webhook secret are present. A payment taken without a verified webhook would be lost."
                />
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b border-border/70 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm">Credit ledger</CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    Newest first. Append-only, written by database functions.
                  </CardDescription>
                  <Link
                    href="/dashboard/billing/ledger"
                    className="mt-2 inline-flex items-center gap-1 font-mono text-[8px] tracking-[0.12em] text-signal uppercase underline-offset-4 hover:underline"
                  >
                    Full ledger &amp; CSV
                    <ArrowUpRightIcon className="size-3" />
                  </Link>
                </div>
                <CoinsIcon className="size-4 text-signal" />
              </div>
            </CardHeader>

            {ledger && ledger.length > 0 ? (
              <ul className="divide-y divide-border/70">
                {ledger.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium">
                        {REASON_LABELS[entry.reason] ?? entry.reason}
                      </p>
                      <p className="mt-0.5 font-mono text-[0.625rem] text-muted-foreground">
                        {formatDate(entry.created_at)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-xs",
                        entry.delta > 0 ? "text-signal" : "text-foreground",
                      )}
                    >
                      {entry.delta > 0 ? "+" : ""}
                      {entry.delta}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <CardContent className="px-5 py-8 text-center">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  No credit activity yet. The signup grant appears here after the profile trigger
                  runs.
                </p>
              </CardContent>
            )}
          </Card>

          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b border-border/70 py-4">
              <CardTitle className="text-sm">How credits settle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 py-4 text-xs leading-relaxed text-muted-foreground">
              <p className="flex items-start gap-2">
                <ShieldCheckIcon className="mt-0.5 size-3.5 shrink-0 text-signal" />A source
                reserves up to 15 credits at initiate. The worker settles the exact minute count
                after ffprobe and returns the rest.
              </p>
              <p className="flex items-start gap-2">
                <ShieldCheckIcon className="mt-0.5 size-3.5 shrink-0 text-signal" />A permanent
                failure refunds the reservation. A retry takes a fresh reservation.
              </p>
              <p className="border-t border-border/70 pt-3">
                Billing questions: contact support with the account email and the Razorpay payment
                id. Never send card details.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
