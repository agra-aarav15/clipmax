import { getServerEnv } from "@/lib/env";

export type BillingConfig = {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  planId: string;
  testMode: boolean;
};

/**
 * Server-only Razorpay configuration.
 *
 * Missing values return null so routes can answer with a specific configuration error. The secret
 * never leaves this module's callers.
 */
export function getBillingConfig(): BillingConfig | null {
  const env = getServerEnv();

  if (
    !env.RAZORPAY_KEY_ID ||
    !env.RAZORPAY_KEY_SECRET ||
    !env.RAZORPAY_WEBHOOK_SECRET ||
    !env.RAZORPAY_PLAN_STARTER_MONTHLY
  ) {
    return null;
  }

  return {
    keyId: env.RAZORPAY_KEY_ID,
    keySecret: env.RAZORPAY_KEY_SECRET,
    webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
    planId: env.RAZORPAY_PLAN_STARTER_MONTHLY,
    testMode: env.RAZORPAY_KEY_ID.startsWith("rzp_test_"),
  };
}

export const MISSING_BILLING_ENV = [
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "RAZORPAY_PLAN_STARTER_MONTHLY",
] as const;
