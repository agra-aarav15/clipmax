import {
  MAX_SOURCE_DURATION_MINUTES,
  OFFERED_PLAN_TIERS,
  PLAN_CATALOG,
  creditsForDurationSeconds,
  formatPlanPrice,
} from "@clipmax/shared";
import { CheckIcon, CoinsIcon, InfoIcon } from "lucide-react";
import Link from "next/link";

import { SectionKicker } from "@/components/landing/section-kicker";
import { Button } from "@/components/ui/button";

const maxCredits = creditsForDurationSeconds(MAX_SOURCE_DURATION_MINUTES * 60);

// Read once on the server. The section stays honest whether or not this build has Razorpay keys.
const checkoutConfigured = Boolean(
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET &&
  process.env.RAZORPAY_WEBHOOK_SECRET &&
  process.env.RAZORPAY_PLAN_STARTER_MONTHLY,
);

const INCLUDED = [
  "Same 9:16 pipeline",
  "Private R2 storage",
  "Signed previews",
  "Unused credits returned",
] as const;

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="relative scroll-mt-24 overflow-hidden border-b border-white/[0.06]"
    >
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_72%_8%,rgba(0,71,171,0.16),transparent_70%)]" />
      </div>

      <div className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 sm:py-28 lg:py-32">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:gap-16">
          <div data-reveal>
            <SectionKicker index="04">Pricing</SectionKicker>
            <h2 className="mt-5 text-[clamp(2.1rem,4.1vw,3.6rem)] leading-[0.98] font-semibold tracking-[-0.055em] text-balance">
              Credits are{" "}
              <span className="font-serif text-[1.06em] leading-[0.85] font-normal tracking-[-0.02em] text-signal italic">
                minutes.
              </span>
            </h2>
          </div>

          <div data-reveal className="max-w-sm lg:pb-2">
            <p className="text-[15px] leading-relaxed text-pretty text-zinc-400">
              One credit buys one minute of source video. A {MAX_SOURCE_DURATION_MINUTES}-minute
              episode reserves {maxCredits} credits, however many clips come out of it.
            </p>
          </div>
        </div>

        <div
          data-reveal
          className="mt-10 flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm leading-relaxed text-zinc-400">
            <span className="text-zinc-200">1 credit = 1 minute.</span> Reserved before the job
            starts. Unused minutes return when it settles.
          </p>
          <span className="flex shrink-0 items-center gap-1.5 font-mono text-[8px] tracking-[0.12em] text-signal uppercase">
            <CoinsIcon className="size-3" aria-hidden="true" />
            No browser-side math
          </span>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:gap-6">
          {OFFERED_PLAN_TIERS.map((tier) => {
            const plan = PLAN_CATALOG[tier];
            const highlighted = tier === "starter";

            return (
              <div
                key={tier}
                data-reveal
                className={
                  highlighted
                    ? "relative rounded-2xl bg-gradient-to-b from-signal/45 via-white/10 to-white/[0.04] p-px shadow-[0_45px_120px_-60px_rgba(0,71,171,0.75)]"
                    : "relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-px"
                }
              >
                <div
                  className={
                    highlighted
                      ? "relative flex h-full flex-col overflow-hidden rounded-[calc(1rem-1px)] bg-[#0a0b0c] p-6 sm:p-7"
                      : "relative flex h-full flex-col rounded-[calc(1rem-1px)] p-6 sm:p-7"
                  }
                >
                  {highlighted ? (
                    <div
                      className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-primary/25 blur-[80px]"
                      aria-hidden="true"
                    />
                  ) : null}

                  <div className="relative flex items-center justify-between gap-3">
                    <h3 className="text-lg font-medium tracking-tight">{plan.name}</h3>
                    {highlighted ? (
                      <span className="rounded-full border border-signal/30 bg-signal/[0.08] px-2.5 py-1 font-mono text-[8px] tracking-[0.12em] text-signal uppercase">
                        For weekly publishing
                      </span>
                    ) : (
                      <span className="font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase">
                        Start here
                      </span>
                    )}
                  </div>

                  <div className="relative mt-7 flex items-end gap-2">
                    <span className="text-[2.6rem] leading-none font-semibold tracking-[-0.05em]">
                      {formatPlanPrice(plan.price, "USD")}
                    </span>
                    <span className="pb-1 font-mono text-[9px] tracking-[0.12em] text-zinc-500 uppercase">
                      {tier === "free" ? "to start" : "/ month"}
                    </span>
                  </div>

                  {tier === "starter" ? (
                    <p className="relative mt-2 font-mono text-[9px] tracking-[0.08em] text-zinc-600">
                      {formatPlanPrice(plan.price, "INR")} / month via Razorpay at launch
                    </p>
                  ) : (
                    <p className="relative mt-2 font-mono text-[9px] tracking-[0.08em] text-zinc-600">
                      No card required
                    </p>
                  )}

                  <p className="relative mt-5 text-sm leading-relaxed text-zinc-400">
                    {plan.tagline}
                  </p>

                  <div className="relative mt-6 flex items-center gap-2 border-y border-white/[0.07] py-3.5 font-mono text-[9px] tracking-[0.12em] text-zinc-300 uppercase">
                    <CoinsIcon className="size-3.5 text-signal/80" aria-hidden="true" />
                    {plan.creditsPerMonth} credits {tier === "free" ? "to start" : "/ month"}
                  </div>

                  <ul className="relative mt-5 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <CheckIcon
                          className="mt-0.5 size-3.5 shrink-0 text-signal"
                          aria-hidden="true"
                        />
                        <span className="text-zinc-400">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="relative mt-7">
                    <Button
                      asChild
                      variant={highlighted ? "default" : "outline"}
                      className={
                        highlighted
                          ? "h-11 w-full rounded-xl text-[13px] font-semibold"
                          : "h-11 w-full rounded-xl border-white/10 bg-white/[0.02] text-[13px]"
                      }
                    >
                      <Link href="/signup">
                        {highlighted ? "Start free, upgrade later" : "Start free"}
                      </Link>
                    </Button>
                    <p className="mt-2.5 text-center font-mono text-[8px] tracking-[0.12em] text-zinc-600 uppercase">
                      {highlighted
                        ? checkoutConfigured
                          ? "Upgrade inside the studio"
                          : "Checkout opens at launch"
                        : "Email or Google sign-in"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          data-reveal
          className="mt-8 grid gap-3 border-t border-white/[0.07] pt-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {INCLUDED.map((item) => (
            <span key={item} className="flex items-center gap-2 text-[12px] text-zinc-500">
              <CheckIcon className="size-3.5 shrink-0 text-signal/80" aria-hidden="true" />
              {item}
            </span>
          ))}
        </div>

        <div
          data-reveal
          className="mt-8 flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5"
        >
          <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-signal/80" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-zinc-500">
            {checkoutConfigured ? (
              <>
                <span className="font-medium text-zinc-300">
                  Checkout is available inside the studio.
                </span>{" "}
                Razorpay handles the payment, and a verified webhook grants the credits. Every new
                account still starts on Free.
              </>
            ) : (
              <>
                <span className="font-medium text-zinc-300">
                  Checkout is not live in this build.
                </span>{" "}
                These are the locked launch amounts. No payment is collected, and every new account
                starts on Free.
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
