import { PLAN_CATALOG, type BillingCheckoutResponse } from "@clipmax/shared";

import { requireAdminClient, requireUser } from "@/lib/api/auth";
import { AppError } from "@/lib/api/errors";
import { handleRoute, jsonOk } from "@/lib/api/response";
import { getBillingConfig, MISSING_BILLING_ENV } from "@/lib/payments/config";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { createSubscription } from "@/lib/payments/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriptionRow = {
  status: string;
  current_period_end: string | null;
};

export async function POST() {
  return handleRoute(async () => {
    const { supabase, user } = await requireUser();
    const config = getBillingConfig();

    if (!config) {
      throw new AppError(
        "CONFIGURATION_ERROR",
        `Billing is not configured. Add ${MISSING_BILLING_ENV.join(", ")} before taking payments.`,
      );
    }

    const admin = requireAdminClient();
    await enforceRateLimit(admin, RATE_LIMITS.checkout, user.id);

    const plan = PLAN_CATALOG.starter;

    const { data: existing, error: existingError } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle<SubscriptionRow>();

    if (existingError) {
      throw new AppError("INTERNAL_ERROR", "Could not check the current subscription.", {
        details: existingError.message,
      });
    }

    const periodEnd = existing?.current_period_end ? new Date(existing.current_period_end) : null;
    const currentlyActive =
      existing?.status === "active" && (!periodEnd || periodEnd.getTime() > Date.now());

    if (currentlyActive) {
      throw new AppError(
        "PLAN_LIMIT_REACHED",
        "Starter is already active on this account. Manage the renewal in Razorpay.",
      );
    }

    let subscription;
    try {
      subscription = await createSubscription(config, {
        userId: user.id,
        email: user.email ?? null,
      });
    } catch (cause) {
      throw new AppError(
        "CONFIGURATION_ERROR",
        cause instanceof Error
          ? `Razorpay could not create the subscription: ${cause.message}`
          : "Razorpay could not create the subscription.",
        { cause },
      );
    }

    // Store the subscription against the user before the browser opens Checkout. The webhook then
    // always has a server-side owner for the subscription, even if notes are missing.
    const { error: storeError } = await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        provider: "razorpay",
        provider_customer_id: subscription.customer_id ?? null,
        provider_subscription_id: subscription.id,
        plan: "starter",
        status: "pending",
        current_period_end: null,
      },
      { onConflict: "user_id" },
    );

    if (storeError) {
      throw new AppError(
        "INTERNAL_ERROR",
        "The subscription was created but could not be stored. Do not pay; contact support.",
        { details: storeError.message },
      );
    }

    const response: BillingCheckoutResponse = {
      keyId: config.keyId,
      subscriptionId: subscription.id,
      planName: plan.name,
      credits: plan.creditsPerMonth,
      testMode: config.testMode,
    };

    return jsonOk(response);
  });
}
