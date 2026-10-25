import { requireAdminClient, requireUser } from "@/lib/api/auth";
import { AppError } from "@/lib/api/errors";
import { handleRoute, jsonOk } from "@/lib/api/response";
import { getBillingConfig, MISSING_BILLING_ENV } from "@/lib/payments/config";
import { cancelSubscription } from "@/lib/payments/razorpay";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriptionRow = {
  status: string;
  provider_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

type CancellationResult = {
  updated: boolean;
  reason?: string;
  status?: string;
  cancelAtPeriodEnd?: boolean;
  periodEnd?: string | null;
};

const CANCELABLE = new Set(["active", "pending", "past_due", "paused"]);

export async function POST() {
  return handleRoute(async () => {
    const { user } = await requireUser();
    const admin = requireAdminClient();
    const config = getBillingConfig();

    if (!config) {
      throw new AppError(
        "CONFIGURATION_ERROR",
        `Billing is not configured. Add ${MISSING_BILLING_ENV.join(", ")}.`,
      );
    }

    await enforceRateLimit(admin, RATE_LIMITS.checkout, user.id);

    const { data: subscription, error } = await admin
      .from("subscriptions")
      .select("status, provider_subscription_id, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .maybeSingle<SubscriptionRow>();

    if (error) {
      console.error("[billing] could not load subscription for cancellation", {
        code: error.code,
        message: error.message,
      });
      throw new AppError("INTERNAL_ERROR", "Could not load the subscription. Try again.");
    }

    if (!subscription || !CANCELABLE.has(subscription.status)) {
      throw new AppError("PROJECT_NOT_READY", "There is no active subscription to cancel.");
    }

    if (subscription.cancel_at_period_end) {
      return jsonOk({
        cancelled: true,
        cancelAtPeriodEnd: true,
        periodEnd: subscription.current_period_end,
        alreadyScheduled: true,
      });
    }

    // An attached pending checkout is cancelled immediately. A pending row with no remote id has
    // never reached Razorpay, so clearing it locally is the whole cancellation.
    if (subscription.status === "pending" && !subscription.provider_subscription_id) {
      const { data, error: cancelError } = await admin.rpc("mark_subscription_cancellation", {
        p_user_id: user.id,
        p_provider_subscription_id: null,
        p_at_cycle_end: false,
      });

      if (cancelError || (data as CancellationResult | null)?.updated !== true) {
        console.error("[billing] could not clear an unattached pending checkout", {
          code: cancelError?.code,
          message: cancelError?.message,
          data,
        });
        throw new AppError("INTERNAL_ERROR", "Could not cancel the pending checkout. Try again.");
      }

      return jsonOk({
        cancelled: true,
        cancelAtPeriodEnd: false,
        periodEnd: null,
        alreadyScheduled: false,
      });
    }

    if (!subscription.provider_subscription_id) {
      throw new AppError(
        "PROJECT_NOT_READY",
        "The subscription has no Razorpay id. Contact support before cancelling.",
      );
    }

    // Paid subscriptions keep access until the end of the paid period. Pending, past-due, and
    // paused subscriptions are cancelled immediately so they cannot charge again.
    const atCycleEnd = subscription.status === "active";

    try {
      await cancelSubscription(config, subscription.provider_subscription_id, atCycleEnd);
    } catch (cause) {
      throw new AppError(
        "CONFIGURATION_ERROR",
        cause instanceof Error
          ? `Razorpay could not cancel the subscription: ${cause.message}`
          : "Razorpay could not cancel the subscription.",
        { cause },
      );
    }

    const { data, error: recordError } = await admin.rpc("mark_subscription_cancellation", {
      p_user_id: user.id,
      p_provider_subscription_id: subscription.provider_subscription_id,
      p_at_cycle_end: atCycleEnd,
    });

    const result = data as CancellationResult | null;

    if (recordError || !result || result.updated !== true) {
      console.error("[billing] Razorpay cancelled but the local record did not update", {
        code: recordError?.code,
        message: recordError?.message,
        result,
      });
      throw new AppError(
        "INTERNAL_ERROR",
        "Razorpay accepted the cancellation, but ClipMax could not record it. Reload billing before paying again.",
      );
    }

    return jsonOk({
      cancelled: true,
      cancelAtPeriodEnd: result.cancelAtPeriodEnd === true,
      periodEnd:
        result.periodEnd ??
        (atCycleEnd ? subscription.current_period_end : new Date().toISOString()),
      alreadyScheduled: false,
    });
  });
}
