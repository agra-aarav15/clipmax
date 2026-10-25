import type { Metadata } from "next";
import Link from "next/link";

import { LegalList, LegalSection, PublicPage } from "@/components/site/public-page";

export const metadata: Metadata = {
  title: "Refunds",
  description:
    "How ClipMax handles failed renders, unused credit holds, subscription cancellations, duplicate charges, and refund requests.",
  alternates: { canonical: "/refund" },
};

export default function RefundPage() {
  return (
    <PublicPage
      kicker="Refunds"
      title="Failed work should not"
      accent="cost you."
      intro="Credits are prepaid minutes, so the refund rule is simple: if ClipMax cannot finish the work, the hold goes back. This page explains automatic refunds, subscription cancellation, and what to do about a payment error."
      updated="Last updated 25 October 2026 · Private beta"
    >
      <LegalSection index="01" title="Automatic refunds">
        <LegalList
          items={[
            "A source reserves credits before processing. After the worker probes the real duration, it settles the exact minute count and returns the unused hold automatically.",
            "If a job fails permanently, the project’s remaining hold is refunded to your wallet without a support ticket.",
            "If a source is rejected before processing — an unsupported link, a private video, a missing object, or an over-limit file — no credits should remain held. If a hold survives, contact support with the project id.",
            "Rendered clips are not re-charged. Downloading and replaying them costs no extra credits.",
          ]}
        />
      </LegalSection>

      <LegalSection index="02" title="Cancelling Starter">
        <p>
          Cancel from{" "}
          <Link href="/dashboard/billing" className="text-signal underline-offset-4 hover:underline">
            Billing → Manage subscription
          </Link>
          . Cancellation stops future charges at the end of the current paid period. You keep access
          and credits until then. We do not automatically claw back credits already granted.
        </p>
        <p>
          If you cancel during a free trial or before the first charge, no charge should be taken. If
          Razorpay shows a charge after cancellation, contact support with the payment id.
        </p>
      </LegalSection>

      <LegalSection index="03" title="When we issue a refund">
        <LegalList
          items={[
            "A duplicate charge for the same billing period.",
            "A charge you did not authorise, after we verify the account and payment.",
            "A paid subscription that never granted the credits shown at checkout and cannot be corrected.",
            "A charge made after a cancellation that we failed to process correctly.",
            "Any refund required by applicable consumer law.",
          ]}
        />
        <p>
          Partial-month refunds for unused time are not automatic, because credits are granted at the
          start of the period and remain usable until it ends. We may still approve one at our
          discretion where the circumstances are clear.
        </p>
      </LegalSection>

      <LegalSection index="04" title="How to ask">
        <p>
          Use the{" "}
          <Link href="/support" className="text-signal underline-offset-4 hover:underline">
            support route
          </Link>{" "}
          within 7 days of the charge. Include:
        </p>
        <LegalList
          items={[
            "the account email;",
            "the Razorpay payment id and subscription id, if shown;",
            "the charge date and amount;",
            "what happened, with any project id or error text.",
          ]}
        />
        <p>
          Never send a card number, CVV, password, or one-time code. We will not ask for them. Approved
          refunds go back to the original payment method through Razorpay; the bank’s timeline
          applies, typically 5–10 business days after approval.
        </p>
      </LegalSection>

      <LegalSection index="05" title="Chargebacks">
        <p>
          Please contact us before opening a chargeback so we can fix the issue directly. A chargeback
          may pause the account while the payment is disputed. We will provide Razorpay and the bank
          with the subscription and webhook records needed to resolve it.
        </p>
      </LegalSection>

      <LegalSection index="06" title="Your statutory rights">
        <p>
          Nothing in this policy limits rights you have under mandatory consumer protection law. If
          those rights give you a stronger remedy than this page, they apply.
        </p>
      </LegalSection>
    </PublicPage>
  );
}
