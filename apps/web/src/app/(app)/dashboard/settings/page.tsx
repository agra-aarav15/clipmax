import { getPlan, type PlanTier } from "@clipmax/shared";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CreditCardIcon,
  FileTextIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  WalletIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DataControls } from "@/components/settings/data-controls";
import { ProfileForm } from "@/components/settings/profile-form";
import { StudioConfigurationState } from "@/components/studio/configuration-state";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
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

type ProfileRow = {
  email: string | null;
  display_name: string | null;
  plan: string;
  created_at: string;
};

type WalletRow = { balance: number };

type SubscriptionRow = {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export default async function SettingsPage() {
  const { supabase, user } = await getCurrentUser();

  if (!supabase) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-[9px] tracking-[0.2em] text-signal uppercase">Account</p>
        <h1 className="mt-3 text-[clamp(2rem,4vw,3rem)] leading-none font-semibold tracking-[-0.055em]">
          Settings are not connected.
        </h1>
        <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-zinc-400">
          Add the Supabase credentials to load the real profile, plan, and data controls. No account
          facts are invented for the preview.
        </p>
        <div className="mt-8">
          <StudioConfigurationState keys={REQUIRED_STUDIO_KEYS} />
        </div>
      </div>
    );
  }

  if (!user) redirect("/signup?next=/dashboard/settings&mode=signin");

  const [
    { data: profile, error: profileError },
    { data: wallet, error: walletError },
    { data: subscription, error: subscriptionError },
    { count: projectCount },
    { count: clipCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("email, display_name, plan, created_at")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>(),
    supabase
      .from("credit_wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle<WalletRow>(),
    supabase
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .maybeSingle<SubscriptionRow>(),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("clips").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const planTier = (profile?.plan ?? "free") as PlanTier;
  const plan = getPlan(planTier) ?? getPlan("free");
  const credits = typeof wallet?.balance === "number" ? wallet.balance : null;
  const email = profile?.email ?? user.email ?? "Unknown email";
  const displayName = profile?.display_name?.trim() || email.split("@")[0] || "ClipMax creator";
  const subscriptionStatus = subscription?.status ?? null;
  const loadErrors = [profileError, walletError, subscriptionError].filter(
    (error): error is NonNullable<typeof error> => Boolean(error),
  );

  if (loadErrors.length > 0) {
    // Keep provider details in server logs; do not surface raw Postgres/Supabase messages.
    console.error(
      "[settings] account data failed to load",
      loadErrors.map((error) => ({ code: error.code, message: error.message })),
    );
  }

  return (
    <div className="mx-auto max-w-[1180px]">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 font-mono text-[8.5px] tracking-[0.14em] text-zinc-500 uppercase transition-colors hover:text-zinc-200"
        >
          <ArrowLeftIcon className="size-3" />
          Studio
        </Link>
        <span aria-hidden="true" className="text-zinc-700">
          /
        </span>
        <span className="font-mono text-[8.5px] tracking-[0.14em] text-zinc-600 uppercase">
          Settings
        </span>
      </nav>

      <div className="mt-5">
        <p className="font-mono text-[9px] tracking-[0.2em] text-signal uppercase">Account</p>
        <h1 className="mt-3 max-w-3xl text-[clamp(2rem,4vw,3.2rem)] leading-[0.98] font-semibold tracking-[-0.06em] text-balance">
          Your account, on{" "}
          <span className="font-serif text-[1.06em] font-normal tracking-[-0.03em] text-signal italic">
            your terms.
          </span>
        </h1>
        <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-zinc-400">
          Change how the studio addresses you, take a copy of your data, or close the account. The
          destructive action is deliberately hard to trigger and never pretends to be reversible.
        </p>
      </div>

      {loadErrors.length > 0 ? (
        <div
          role="status"
          className="mt-6 flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/[0.06] px-3.5 py-3 text-[11.5px] leading-relaxed text-red-200"
        >
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            Some account data could not be loaded. Nothing was changed. Refresh to try again, or
            check the{" "}
            <Link href="/status" className="underline underline-offset-4 hover:text-white">
              service status
            </Link>
            .
          </span>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0a0b]">
            <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
              <UserRoundIcon className="size-3.5 text-signal" />
              <h2 className="text-[12.5px] font-medium text-zinc-200">Profile</h2>
              <span className="ml-auto font-mono text-[8px] tracking-[0.12em] text-zinc-600 uppercase">
                {plan?.name ?? "Free"} plan
              </span>
            </div>
            <div className="px-4 py-5 sm:px-5">
              <ProfileForm initialDisplayName={displayName} email={email} />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0a0b]">
            <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
              <ShieldCheckIcon className="size-3.5 text-signal" />
              <h2 className="text-[12.5px] font-medium text-zinc-200">Data &amp; privacy</h2>
            </div>
            <div className="px-4 py-5 sm:px-5">
              <DataControls
                subscriptionStatus={subscriptionStatus}
                cancelAtPeriodEnd={Boolean(subscription?.cancel_at_period_end)}
                periodEnd={subscription?.current_period_end ?? null}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0a0b]">
            <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
              <FileTextIcon className="size-3.5 text-signal" />
              <h2 className="text-[12.5px] font-medium text-zinc-200">Policies</h2>
            </div>
            <div className="grid gap-px bg-white/[0.05] sm:grid-cols-2">
              {[
                { href: "/privacy", label: "Privacy policy", detail: "What is stored, and why" },
                { href: "/terms", label: "Terms of service", detail: "The beta agreement" },
                { href: "/refund", label: "Refund policy", detail: "Failed work, cancelled plans" },
                { href: "/support", label: "Support", detail: "How to reach a person" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex min-h-16 items-center justify-between gap-3 bg-[#0a0a0b] px-4 py-3.5 transition-colors hover:bg-white/[0.02] sm:px-5"
                >
                  <span>
                    <span className="block text-[12px] text-zinc-300 group-hover:text-white">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[10.5px] text-zinc-600">{item.detail}</span>
                  </span>
                  <ArrowUpRightIcon className="size-3.5 text-zinc-700 transition-colors group-hover:text-signal" />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0a0b]">
            <div className="border-b border-white/[0.06] px-4 py-3.5">
              <p className="font-mono text-[8px] tracking-[0.18em] text-zinc-500 uppercase">
                Record
              </p>
              <h2 className="mt-1 text-[12.5px] font-medium text-zinc-200">Account facts</h2>
            </div>
            <dl className="space-y-2.5 px-4 py-4">
              <DetailRow label="Email" value={email} />
              <DetailRow label="Account id" value={`${user.id.slice(0, 8)}…`} />
              <DetailRow
                label="Member since"
                value={formatDate(profile?.created_at ?? user.created_at)}
              />
              <DetailRow
                label="Last sign-in"
                value={user.last_sign_in_at ? formatDate(user.last_sign_in_at) : "—"}
              />
              <DetailRow label="Projects" value={String(projectCount ?? 0)} />
              <DetailRow label="Clips" value={String(clipCount ?? 0)} />
            </dl>
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0a0b]">
            <div className="border-b border-white/[0.06] px-4 py-3.5">
              <p className="font-mono text-[8px] tracking-[0.18em] text-zinc-500 uppercase">
                Billing
              </p>
              <h2 className="mt-1 text-[12.5px] font-medium text-zinc-200">
                {plan?.name ?? "Free"} · {credits === null ? "—" : credits} credits
              </h2>
            </div>
            <div className="space-y-3 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[11.5px] text-zinc-400">
                  <CreditCardIcon className="size-3.5 text-signal/80" />
                  Subscription
                </span>
                <span
                  className={cn(
                    "font-mono text-[8.5px] tracking-[0.1em] uppercase",
                    subscriptionStatus === "active" ? "text-signal" : "text-zinc-500",
                  )}
                >
                  {subscriptionStatus
                    ? (SUBSCRIPTION_LABELS[subscriptionStatus] ?? subscriptionStatus)
                    : "None"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[11.5px] text-zinc-400">
                  <WalletIcon className="size-3.5 text-signal/80" />
                  Renews / ends
                </span>
                <span className="font-mono text-[9px] text-zinc-500">
                  {subscription?.current_period_end
                    ? formatDate(subscription.current_period_end)
                    : "—"}
                </span>
              </div>
              <Link
                href="/dashboard/billing"
                className="flex min-h-9 items-center justify-between gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 text-[11.5px] text-zinc-300 transition-colors hover:border-signal/20 hover:text-signal"
              >
                Open billing
                <ArrowUpRightIcon className="size-3" />
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-4">
            <p className="flex items-center gap-2 font-mono text-[8px] tracking-[0.16em] text-zinc-500 uppercase">
              <KeyRoundIcon className="size-3 text-zinc-600" />
              Sign-in
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-zinc-500">
              Email magic links and Google are managed by Supabase Auth. ClipMax never sees your
              Google password. Signing out clears this device’s session cookie.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="font-mono text-[8px] tracking-[0.12em] text-zinc-600 uppercase">{label}</dt>
      <dd className="max-w-[62%] truncate text-right text-[11px] text-zinc-300">{value}</dd>
    </div>
  );
}
