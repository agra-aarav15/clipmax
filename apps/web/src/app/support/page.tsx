import {
  ArrowUpRightIcon,
  CreditCardIcon,
  LifeBuoyIcon,
  ShieldAlertIcon,
  UserRoundCogIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { LegalList, LegalSection, PublicPage } from "@/components/site/public-page";

export const metadata: Metadata = {
  title: "Support",
  description:
    "How to reach ClipMax support during the private beta, what to include, and how to report a security issue.",
  alternates: { canonical: "/support" },
};

const ISSUES_URL = "https://github.com/agra-aarav15/clipmax/issues";
const SECURITY_URL = "https://github.com/agra-aarav15/clipmax/security/advisories/new";

export const dynamic = "force-dynamic";

export default function SupportPage() {
  const email = process.env.SUPPORT_EMAIL?.trim() ?? "";

  return (
    <PublicPage
      kicker="Support"
      title="A real person reads"
      accent="every report."
      intro="ClipMax is a small private beta. Support runs through the public issue tracker and, when configured, a monitored inbox. There is no chatbot pretending to be a support team, and no ticket number that goes nowhere."
      updated="Private beta · Best-effort response, usually within two business days"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={ISSUES_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-colors hover:border-signal/25 hover:bg-signal/[0.035]"
        >
          <span className="grid size-9 place-items-center rounded-lg border border-signal/20 bg-signal/[0.07]">
            <LifeBuoyIcon className="size-4 text-signal" />
          </span>
          <p className="mt-4 text-[14px] font-medium text-zinc-100">Open a support issue</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500">
            Product questions, failed renders, billing records, and data requests. Public by
            default, so omit anything sensitive.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-[8px] tracking-[0.14em] text-signal uppercase">
            github.com/agra-aarav15/clipmax
            <ArrowUpRightIcon className="size-3" />
          </span>
        </a>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <span className="grid size-9 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
            <ShieldAlertIcon className="size-4 text-amber-200" />
          </span>
          <p className="mt-4 text-[14px] font-medium text-zinc-100">Report a security issue</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500">
            Use GitHub’s private advisory flow. Do not publish exploit details, tokens, or another
            person’s data in a public issue.
          </p>
          <a
            href={SECURITY_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-[8px] tracking-[0.14em] text-amber-200/90 uppercase underline-offset-4 hover:underline"
          >
            Private advisory
            <ArrowUpRightIcon className="size-3" />
          </a>
        </div>
      </div>

      {email ? (
        <div className="rounded-2xl border border-signal/15 bg-signal/[0.035] p-5">
          <p className="font-mono text-[8px] tracking-[0.18em] text-signal uppercase">
            Monitored inbox
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
            Prefer email? Write to{" "}
            <a
              href={`mailto:${email}`}
              className="text-signal underline underline-offset-4 hover:text-white"
            >
              {email}
            </a>
            . Include the same details listed below.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.03] p-5">
          <p className="font-mono text-[8px] tracking-[0.18em] text-amber-200/80 uppercase">
            Email support not configured
          </p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-zinc-400">
            This deployment has no monitored support inbox. Use the issue tracker above; it is the
            only channel that currently reaches the operator. Nothing here accepts a message that
            would disappear.
          </p>
        </div>
      )}

      <LegalSection index="01" title="What to include">
        <LegalList
          items={[
            <>
              <span className="inline-flex items-center gap-1.5 text-zinc-200">
                <UserRoundCogIcon className="size-3.5 text-signal/80" /> Account
              </span>{" "}
              — the email you signed in with and your display name.
            </>,
            <>
              <span className="inline-flex items-center gap-1.5 text-zinc-200">
                <LifeBuoyIcon className="size-3.5 text-signal/80" /> Project
              </span>{" "}
              — the project id from the results page, the source type, and the exact error text.
            </>,
            <>
              <span className="inline-flex items-center gap-1.5 text-zinc-200">
                <CreditCardIcon className="size-3.5 text-signal/80" /> Billing
              </span>{" "}
              — the Razorpay payment or subscription id, charge date, amount, and what the billing
              page shows.
            </>,
            "What you expected, what happened, and the browser or device if the issue is visual.",
          ]}
        />
      </LegalSection>

      <LegalSection index="02" title="What never to send">
        <p>
          Do not send passwords, magic-link URLs, one-time codes, API keys, card numbers, CVVs, or
          copies of someone else’s video. Support will never ask for these. If you already posted a
          secret publicly, revoke it first, then tell us.
        </p>
      </LegalSection>

      <LegalSection index="03" title="Data and account requests">
        <p>
          Export your data from{" "}
          <Link
            href="/dashboard/settings"
            className="text-signal underline-offset-4 hover:underline"
          >
            Settings → Data &amp; privacy
          </Link>
          . Account deletion is also there and removes the profile, projects, clips, transcripts,
          jobs, credits, and stored objects. If you cannot sign in, open an issue and describe the
          account; we will verify ownership before acting.
        </p>
      </LegalSection>

      <LegalSection index="04" title="Service status">
        <p>
          Configuration and worker health are published at{" "}
          <Link href="/status" className="text-signal underline-offset-4 hover:underline">
            /status
          </Link>
          . The page reports what the running process can actually verify; it does not invent uptime
          percentages.
        </p>
      </LegalSection>

      <LegalSection index="05" title="Response expectations">
        <p>
          This is a private beta without a paid support SLA. We aim to acknowledge within two
          business days and to be direct when something cannot be fixed immediately. Security
          reports take priority.
        </p>
      </LegalSection>
    </PublicPage>
  );
}
