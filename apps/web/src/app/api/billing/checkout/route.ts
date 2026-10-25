import { PLAN_CATALOG, type BillingCheckoutResponse } from "@clipmax/shared";

import { requireAdminClient, requireUser } from "@/lib/api/auth";
import { AppError } from "@/lib/api/errors";
import { handleRoute, jsonOk } from "@/lib/api/response";
import { getBillingConfig, MISSING_BILLING_ENV } from "@/lib/payments/config";
import { cancelSubscription, createSubscription } from "@/lib/payments/razorpay";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A second checkout inside this window reuses the remote subscription instead of creating one. */
const CHECKOUT_COOLDOWN_SECONDS = 600;

type CheckoutDecision =
  | {
      action: "manage";
      status: string;
      cancelAtPeriodEnd: boolean;
      periodEnd: string | null;
    }
  | { action: "reuse"; attemptId: string; subscriptionId: string }
  | { action: "create"; attemptId: string; orphanSubscriptionId?: string | null };

function checkoutResponse(input: {
  keyId: string;
  subscriptionId: string;
  testMode: boolean;
}): BillingCheckoutResponse {
  const plan = PLAN_CATALOG.starter;
  return {
    keyId: input.keyId,
    subscriptionId: input.subscriptionId,
    planName: plan.name,
    credits: plan.creditsPerMonth,
    testMode: input.testMode,
  };
}

export async function POST() {
  return handleRoute(async () => {
    const { user } = await requireUser();
    const config = getBillingConfig();

    if (!config) {
      throw new AppError(
        "CONFIGURATION_ERROR",
        `Billing is not configured. Add ${MISSING_BILLING_ENV.join(", ")} before taking payments.`,
      );
    }

    const admin = requireAdminClient();
    await enforceRateLimit(admin, RATE_LIMITS.checkout, user.id);

    // `begin_checkout` locks the subscription row, so two browser tabs cannot both create a remote
    // subscription. It returns one of three honest outcomes: manage, reuse, or create.
    const { data, error } = await admin.rpc("begin_checkout", {
      p_user_id: user.id,
      p_cooldown_seconds: CHECKOUT_COOLDOWN_SECONDS,
    });

    if (error) {
      console.error("[billing] begin_checkout failed", {
        code: error.code,
        message: error.message,
      });
      throw new AppError(
        "INTERNAL_ERROR",
        "Checkout could not be started. No payment was taken. Try again in a moment.",
      );
    }

    const decision = data as CheckoutDecision | null;

    if (!decision || typeof decision.action !== "string") {
      console.error("[billing] begin_checkout returned an unexpected decision", data);
      throw new AppError(
        "INTERNAL_ERROR",
        "Checkout could not be started. No payment was taken. Try again in a moment.",
      );
    }

    if (decision.action === "manage") {
      throw new AppError(
        "PLAN_LIMIT_REACHED",
        decision.cancelAtPeriodEnd
          ? "Starter is already active and scheduled to end at the close of this billing period."
          : "Starter is already active on this account. Manage the renewal in Razorpay.",
        { details: { status: decision.status, periodEnd: decision.periodEnd } },
      );
    }

    if (decision.action === "reuse") {
      return jsonOk(
        checkoutResponse({
          keyId: config.keyId,
          subscriptionId: decision.subscriptionId,
          testMode: config.testMode,
        }),
      );
    }

    if (decision.action !== "create" || !decision.attemptId) {
      console.error("[billing] begin_checkout returned an unknown action", data);
      throw new AppError(
        "INTERNAL_ERROR",
        "Checkout could not be started. No payment was taken. Try again in a moment.",
      );
    }

    // A stale pending checkout was never paid. Cancel it remotely before starting another one. If
    // Razorpay refuses, fail closed: creating a second live subscription while the first may still
    // be payable risks charging the customer twice.
    if (decision.orphanSubscriptionId) {
      try {
        await cancelSubscription(config, decision.orphanSubscriptionId, false);
      } catch (cause) {
        console.error("[billing] could not cancel an orphaned checkout; refusing a new one", cause);
        await admin.rpc("release_checkout_attempt", {
          p_user_id: user.id,
          p_attempt_id: decision.attemptId,
        });
        throw new AppError(
          "CONFIGURATION_ERROR",
          "A previous unpaid checkout could not be cancelled, so a new checkout was not started. No new payment was taken. Try again in a minute.",
          { cause },
        );
      }
    }

    let subscription;
    try {
      subscription = await createSubscription(config, {
        userId: user.id,
        email: user.email ?? null,
        attemptId: decision.attemptId,
      });
    } catch (cause) {
      await admin.rpc("release_checkout_attempt", {
        p_user_id: user.id,
        p_attempt_id: decision.attemptId,
      });
      throw new AppError(
        "CONFIGURATION_ERROR",
        cause instanceof Error
          ? `Razorpay could not create the subscription: ${cause.message}`
          : "Razorpay could not create the subscription.",
        { cause },
      );
    }

    // Store the remote id against this exact attempt before the browser opens Checkout. If another
    // request superseded the attempt, the attach is refused and the remote subscription is cancelled.
    const { data: attached, error: attachError } = await admin.rpc(
      "attach_checkout_subscription",
      {
        p_user_id: user.id,
        p_attempt_id: decision.attemptId,
        p_subscription_id: subscription.id,
        p_customer_id: subscription.customer_id ?? null,
      },
    );

    if (attachError || attached !== true) {
      console.error("[billing] attach_checkout_subscription failed", {
        code: attachError?.code,
        message: attachError?.message,
        attached,
      });

      try {
        await cancelSubscription(config, subscription.id, false);
      } catch (cause) {
        console.error("[billing] could not cancel an unattached subscription", cause);
      }

      throw new AppError(
        "INTERNAL_ERROR",
        "Checkout could not be recorded, so it was cancelled. No payment was taken. Try again.",
      );
    }

    return jsonOk(
      checkoutResponse({
        keyId: config.keyId,
        subscriptionId: subscription.id,
        testMode: config.testMode,
      }),
    );
  });
}
