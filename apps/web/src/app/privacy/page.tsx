import type { Metadata } from "next";
import Link from "next/link";

import { LegalList, LegalSection, PublicPage } from "@/components/site/public-page";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What ClipMax collects, why it processes it, where it is stored, and how to export or delete your account.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PublicPage
      kicker="Privacy"
      title="Your recordings are"
      accent="yours."
      intro="ClipMax processes long-form video so you can publish short clips. This page explains exactly what we collect, which processors touch it, and how to get it back or delete it. The private beta runs on real data only — no sample rows are mixed into your account."
      updated="Last updated 25 October 2026 · Private beta"
    >
      <LegalSection index="01" title="Who this covers">
        <p>
          This policy covers the ClipMax website and studio at{" "}
          <span className="text-zinc-200">clipmax</span>. It applies to account holders and anyone
          who visits the public site. It does not cover third-party sites you link to or services you
          use to publish a clip.
        </p>
      </LegalSection>

      <LegalSection index="02" title="What we collect">
        <LegalList
          items={[
            <>
              <span className="text-zinc-200">Account data.</span> Your email address, display name,
              avatar if Google provides one, and authentication identifiers. Magic-link and Google
              sign-in are handled by Supabase Auth.
            </>,
            <>
              <span className="text-zinc-200">Content you submit.</span> Uploaded video and audio,
              public source links, filenames, duration, MIME type, file size, transcripts with
              word-level timestamps, detected clip candidates, rendered vertical clips, and
              thumbnails.
            </>,
            <>
              <span className="text-zinc-200">Product records.</span> Projects, job attempts and
              errors, credit reservations, wallet balance, and the append-only credit ledger.
            </>,
            <>
              <span className="text-zinc-200">Billing identifiers.</span> Razorpay customer,
              subscription, and payment ids, plan state, and period dates. Card details are entered
              in Razorpay Checkout and are never sent to or stored by ClipMax.
            </>,
            <>
              <span className="text-zinc-200">Technical data.</span> IP address, browser user agent,
              request timestamps, and error logs produced by the hosting provider and application.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection index="03" title="Why we process it">
        <LegalList
          items={[
            "To create your account, sign you in, and keep the session secure.",
            "To download or receive your source, transcribe it, select moments, render 9:16 clips, and serve signed previews and downloads.",
            "To reserve, settle, and refund credits and to reconcile subscription payments.",
            "To prevent abuse, enforce rate limits, debug failures, and answer support requests.",
            "To meet legal, tax, and accounting obligations that apply to paid plans.",
          ]}
        />
        <p>
          Where data protection law requires a legal basis, we rely on performance of our contract
          with you, our legitimate interest in running and securing the service, compliance with
          legal obligations, and consent where we ask for it.
        </p>
      </LegalSection>

      <LegalSection index="04" title="Processors and storage">
        <LegalList
          items={[
            <>
              <span className="text-zinc-200">Supabase</span> hosts authentication and the Postgres
              database. Row-level security keeps one account’s rows separate from another’s.
            </>,
            <>
              <span className="text-zinc-200">Cloudflare R2</span> stores source video, rendered
              clips, and thumbnails in a private bucket. Playback uses short-lived signed URLs, not
              public objects.
            </>,
            <>
              <span className="text-zinc-200">Razorpay</span> processes subscription payments and
              sends signed webhooks that grant credits.
            </>,
            <>
              <span className="text-zinc-200">The hosting provider</span> runs the web application
              and worker, and may keep short-lived access and error logs.
            </>,
            <>
              <span className="text-zinc-200">Configured AI providers</span> may receive audio or
              transcript text for transcription and highlight selection when those integrations are
              enabled. The deployment’s environment decides which provider is used.
            </>,
          ]}
        />
        <p>
          These providers may process data outside your country. Where required, transfers rely on
          the provider’s contractual safeguards. We do not sell personal data or share it for
          advertising.
        </p>
      </LegalSection>

      <LegalSection index="05" title="Cookies">
        <p>
          ClipMax uses cookies for authentication and session refresh. There are no advertising
          trackers or third-party analytics cookies in the studio. Clearing cookies signs you out.
        </p>
      </LegalSection>

      <LegalSection index="06" title="Retention and deletion">
        <p>
          Project content stays until you delete the project or your account. Deleting a project
          removes its source object, transcript, clip rows, and rendered objects. Deleting your
          account removes the profile and cascades to projects, clips, transcripts, jobs, credits,
          and subscription rows, and asks storage to delete the associated objects.
        </p>
        <p>
          Minimal webhook summaries and accounting records may be retained where needed to prevent
          duplicate grants, resolve disputes, or meet tax obligations. Hosting logs expire on the
          provider’s normal schedule.
        </p>
      </LegalSection>

      <LegalSection index="07" title="Your choices">
        <LegalList
          items={[
            <>
              Export a machine-readable copy of your account data from{" "}
              <Link
                href="/dashboard/settings"
                className="text-signal underline-offset-4 hover:underline"
              >
                Settings → Data &amp; privacy
              </Link>
              .
            </>,
            "Correct your display name in Settings. Email changes are handled through the sign-in provider.",
            "Delete a single project from its results page, or delete the whole account from Settings.",
            "Ask a question or object to processing through the support route. You can also complain to your local data protection authority.",
          ]}
        />
      </LegalSection>

      <LegalSection index="08" title="Children">
        <p>
          ClipMax is not directed to children. You must be at least 18 years old, or the age of
          majority where you live, to hold an account.
        </p>
      </LegalSection>

      <LegalSection index="09" title="Changes and contact">
        <p>
          We will update this page before a material change takes effect and change the date above.
          For privacy requests, use the{" "}
          <Link href="/support" className="text-signal underline-offset-4 hover:underline">
            support route
          </Link>{" "}
          and include the account email. Never send a password, one-time code, or card number.
        </p>
      </LegalSection>
    </PublicPage>
  );
}
