import type { Metadata } from "next";
import Link from "next/link";

import { LegalList, LegalSection, PublicPage } from "@/components/site/public-page";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The terms that govern the ClipMax private beta: accounts, content rights, credits, billing, acceptable use, and liability.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PublicPage
      kicker="Terms"
      title="A clear deal for"
      accent="sharp tools."
      intro="These terms govern your use of ClipMax during the private beta. They are written to match what the product actually does: private storage, asynchronous processing, deterministic credit accounting, and no promise that an AI-selected moment will go viral."
      updated="Last updated 25 October 2026 · Private beta"
    >
      <LegalSection index="01" title="Agreement and eligibility">
        <p>
          By creating an account or using ClipMax, you agree to these terms and the{" "}
          <Link href="/privacy" className="text-signal underline-offset-4 hover:underline">
            privacy policy
          </Link>
          . You must be at least 18 years old, or the age of majority where you live, and able to
          enter a binding contract. If you use ClipMax for an organisation, you confirm you may bind
          it.
        </p>
      </LegalSection>

      <LegalSection index="02" title="The private beta">
        <p>
          ClipMax is in private beta. Features, limits, and pricing may change, and the service may
          be interrupted for maintenance or capacity. We aim to be honest about failures, but the
          beta is provided without a service-level agreement. We may suspend an account that abuses
          the service, breaks the law, or creates a security or payment risk.
        </p>
      </LegalSection>

      <LegalSection index="03" title="Your account">
        <p>
          Keep access to your email secure. You are responsible for activity under your account. Tell
          us promptly if you believe someone else has access. Sign-in is handled by Supabase Auth
          using a magic link or Google; ClipMax never asks for your Google password.
        </p>
      </LegalSection>

      <LegalSection index="04" title="Your content and the licence you give us">
        <p>
          You keep ownership of the video, audio, links, transcripts, and clips you submit or
          generate. To run the service, you grant ClipMax a limited, non-exclusive licence to host,
          copy, transcode, analyse, crop, caption, and display that content only as needed to process
          your projects and show results back to you.
        </p>
        <p>
          You confirm that you have the rights needed to upload or link the content and to authorise
          this processing. That includes music, footage, and voices belonging to other people. The
          licence ends when you delete the content, except for copies retained briefly in backups or
          as required by law.
        </p>
      </LegalSection>

      <LegalSection index="05" title="AI output needs a human check">
        <p>
          Transcription, highlight selection, scoring, and caption timing are probabilistic. A clip
          may be misheard, mistimed, or simply not very good. Review every export before publishing.
          ClipMax does not guarantee virality, reach, or platform acceptance. The renderer centre-crops
          to 9:16; it does not perform face tracking, and it does not add music you have not supplied.
        </p>
      </LegalSection>

      <LegalSection index="06" title="Credits, plans, and payment">
        <LegalList
          items={[
            "One credit covers one minute of source video, rounded up by the product’s published rule. A source reserves up to the maximum before processing; the worker settles the exact amount after probing and returns the unused hold.",
            "New accounts receive the signup grant shown in the studio. The Free plan may renew a monthly allowance on a best-effort schedule. Allowances do not stack indefinitely and may expire as described in the billing page.",
            "Starter is a recurring monthly subscription charged in INR through Razorpay. Credits are granted only after a verified payment webhook. Starting a checkout does not grant credits.",
            "Prices include applicable taxes only where stated. Razorpay may show tax separately. You authorise recurring charges until you cancel.",
            "Cancelling stops future charges at the end of the current paid period. Credits already granted stay in the wallet. See the refund policy for failed jobs and payment errors.",
          ]}
        />
      </LegalSection>

      <LegalSection index="07" title="Acceptable use">
        <p>You must not use ClipMax to process or publish content that:</p>
        <LegalList
          items={[
            "you do not have the rights to use, or that infringes copyright, trade marks, privacy, or publicity rights;",
            "is illegal, sexually exploits minors, depicts non-consensual sexual content, or incites violence or hatred;",
            "harasses, threatens, defames, or reveals private information about another person;",
            "contains malware, or is designed to probe, overload, scrape, or bypass the service’s limits or security;",
            "misrepresents an AI-generated clip as authentic footage of a real person or event in a way that causes harm.",
          ]}
        />
        <p>
          Do not share account access, resell the service, or use automated requests outside the
          published interface. Rate limits and credit checks are part of the product, not obstacles
          to work around.
        </p>
      </LegalSection>

      <LegalSection index="08" title="Our intellectual property">
        <p>
          ClipMax, its interface, brand, and software are owned by the operator and its licensors.
          These terms give you a limited right to use the service; they do not transfer ownership of
          the product. Feedback you send may be used to improve ClipMax without obligation.
        </p>
      </LegalSection>

      <LegalSection index="09" title="Suspension and termination">
        <p>
          You may stop using ClipMax at any time and delete your account in Settings. We may suspend
          or terminate access for a material breach, non-payment, legal requirement, or risk to other
          users or the service. Where practical, we will explain why and allow you to export content
          first.
        </p>
      </LegalSection>

      <LegalSection index="10" title="Disclaimers and liability">
        <p>
          To the extent permitted by law, ClipMax is provided “as is” and without implied warranties
          of merchantability, fitness for a particular purpose, or non-infringement. We do not
          warrant uninterrupted or error-free operation.
        </p>
        <p>
          To the extent permitted by law, ClipMax is not liable for indirect, incidental, special, or
          consequential losses, lost profits, lost reach, or lost content. Our total liability for a
          claim relating to the service is limited to the greater of the amount you paid ClipMax in
          the three months before the claim or INR 5,000. Nothing here limits liability that cannot
          lawfully be limited, including fraud or death or personal injury caused by negligence.
        </p>
      </LegalSection>

      <LegalSection index="11" title="Indemnity">
        <p>
          You will indemnify ClipMax against third-party claims, damages, and reasonable costs arising
          from content you submitted, your breach of these terms, or your violation of another
          person’s rights, to the extent permitted by law.
        </p>
      </LegalSection>

      <LegalSection index="12" title="Governing law and changes">
        <p>
          These terms are governed by the laws of India. Disputes are subject to the exclusive
          jurisdiction of the courts at the operator’s principal place of business in India, without
          limiting any mandatory consumer rights you have where you live.
        </p>
        <p>
          We may update these terms as the beta changes. A material change will be posted here with a
          new date before it takes effect. Continued use after that date means you accept the updated
          terms. Questions go through the{" "}
          <Link href="/support" className="text-signal underline-offset-4 hover:underline">
            support route
          </Link>
          .
        </p>
      </LegalSection>
    </PublicPage>
  );
}
