import { PLAN_CATALOG, type BillingCheckoutResponse } from "@clipmax/shared";

import { requireAdminClient, requireUser } from "@/lib/api/auth";
import { AppError } from "@/lib/api/errors";
import { handleRoute, jsonOk } from "@/lib/api/response";
import { getBillingConfig, MISSING_BILLING_ENV, type BillingConfig } from "@/lib/payments/config";
import {
  cancelSubscription,
  createSubscription,
  fetchSubscription,
  type RazorpaySubscription,
} from "@/lib/payments/razorpay";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A second checkout inside this window reuses the remote subscription instead of creating one. */
const CHECKOUT_COOLDOWN_SECONDS = 600;

const PREVIOUS_CHECKOUT_OPEN_MESSAGE =
  "A previous checkout is still open in Razorpay. No new payment was taken. Refresh billing in a minute, or contact support if it does not clear.";

type CheckoutDecision =
  | {
      action: "manage";
      status: string;
      cancelAtPeriodEnd: boolean;
      periodEnd: string | null;
    }
  | { action: "reuse"; attemptId: string; subscriptionId: string }
  | { action: "in_progress"; attemptId: string; retryAfterSeconds: number }
  | {
      action: "stale";
      attemptId: string | null;
      subscriptionId: string;
      checkoutStartedAt: string | null;
    }
  | { action: "create"; attemptId: string };

type ClearStaleResult = {
  ok?: boolean;
  reason?: string;
  action?: string;
  attemptId?: string;
};

type ConfirmPaidResult = {
  reconciled?: boolean;
  already?: boolean;
  status?: string;
  reason?: string;
};

type AdminClient = ReturnType<typeof requireAdminClient>;

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

function manageError(input: {
  status: string;
  cancelAtPeriodEnd?: boolean;
  periodEnd?: string | null;
}): AppError {
  return new AppError(
    "PLAN_LIMIT_REACHED",
    input.cancelAtPeriodEnd
      ? "Starter is already active and scheduled to end at the close of this billing period."
      : "Starter is already active on this account. Manage the renewal in Razorpay.",
    {
      details: {
        status: input.status,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
        periodEnd: input.periodEnd ?? null,
      },
    },
  );
}

function toIso(epochSeconds: number | null | undefined): string | null {
  if (typeof epochSeconds !== "number" || !Number.isFinite(epochSeconds)) return null;
  return new Date(epochSeconds * 1000).toISOString();
}

function cancelFlag(value: boolean | number | null | undefined): boolean {
  return value === true || value === 1;
}

function isTerminalStatus(status: string | undefined): boolean {
  return (
    status === "cancelled" ||
    status === "canceled" ||
    status === "completed" ||
    status === "expired"
  );
}

function isLiveButUnconfirmedStatus(status: string | undefined): boolean {
  return (
    status === "authenticated" ||
    status === "pending" ||
    status === "halted" ||
    status === "paused" ||
    status === "past_due"
  );
}

/**
 * Reads a remote subscription without ever turning an unknown state into a destructive action.
 * A transport or API failure throws; a 404 returns null, which means Razorpay has no such id.
 */
async function readRemoteSubscription(
  config: BillingConfig,
  subscriptionId: string,
): Promise<RazorpaySubscription | null> {
  try {
    return await fetchSubscription(config, subscriptionId);
  } catch (cause) {
    throw new AppError(
      "CONFIGURATION_ERROR",
      "A previous checkout could not be verified with Razorpay, so a new one was not started. No new payment was taken. Try again in a minute.",
      { cause },
    );
  }
}

/**
 * Records an already-paid remote subscription locally instead of cancelling it. This is the race
 * where the customer paid but the `subscription.charged` webhook is delayed past the cooldown.
 */
async function reconcilePaidCheckout(
  admin: AdminClient,
  userId: string,
  remote: RazorpaySubscription,
): Promise<never> {
  const { data, error } = await admin.rpc("confirm_paid_checkout", {
    p_user_id: userId,
    p_provider_subscription_id: remote.id,
    p_customer_id: remote.customer_id ?? null,
    p_current_period_end: toIso(remote.current_end),
    p_cancel_at_period_end: cancelFlag(remote.cancel_at_cycle_end),
  });

  const result = data as ConfirmPaidResult | null;

  if (error || result?.reconciled !== true) {
    console.error("[billing] could not reconcile a paid checkout", {
      code: error?.code,
      message: error?.message,
      result,
    });
    throw new AppError(
      "CONFIGURATION_ERROR",
      "A previous payment is still being confirmed, so a new checkout was not started. No new payment was taken. Refresh billing in a minute.",
      { details: { reason: result?.reason ?? "reconcile_failed" } },
    );
  }

  throw manageError({
    status: result.status ?? "active",
    cancelAtPeriodEnd: cancelFlag(remote.cancel_at_cycle_end),
    periodEnd: toIso(remote.current_end),
  });
}

/**
 * Resolves a stale pending checkout.
 *
 * The local row is only `pending`; it does not prove the remote subscription is unpaid. The route
 * fetches the real state first. Only a subscription that is still `created` (or already terminal)
 * is cancelled and cleared. A paid or in-flight subscription is never cancelled, and a failed
 * cancellation leaves the row untouched so the next request can retry it.
 */
async function resolveStaleCheckout(input: {
  admin: AdminClient;
  config: BillingConfig;
  userId: string;
  decision: Extract<CheckoutDecision, { action: "stale" }>;
}): Promise<string> {
  const { admin, config, userId, decision } = input;
  const first = await readRemoteSubscription(config, decision.subscriptionId);

  if (first?.status === "active") {
    return reconcilePaidCheckout(admin, userId, first);
  }

  if (isLiveButUnconfirmedStatus(first?.status)) {
    throw new AppError("RATE_LIMITED", PREVIOUS_CHECKOUT_OPEN_MESSAGE, {
      details: { status: first?.status, retryAfterSeconds: 60 },
    });
  }

  if (first && first.status === "created") {
    // Re-read immediately before the destructive call. A webhook or a customer payment may have
    // moved the subscription since the first read.
    const latest = await readRemoteSubscription(config, first.id);

    if (latest?.status === "active") {
      return reconcilePaidCheckout(admin, userId, latest);
    }

    if (isLiveButUnconfirmedStatus(latest?.status)) {
      throw new AppError("RATE_LIMITED", PREVIOUS_CHECKOUT_OPEN_MESSAGE, {
        details: { status: latest?.status, retryAfterSeconds: 60 },
      });
    }

    if (latest && latest.status === "created") {
      let cancelled: { status?: string } | null;
      try {
        cancelled = await cancelSubscription(config, latest.id, false);
      } catch (cause) {
        throw new AppError(
          "CONFIGURATION_ERROR",
          "A previous unpaid checkout could not be cancelled, so a new checkout was not started. No new payment was taken. Try again in a minute.",
          { cause },
        );
      }

      if (cancelled?.status && !isTerminalStatus(cancelled.status)) {
        throw new AppError(
          "CONFIGURATION_ERROR",
          "Razorpay did not confirm the cancellation of a previous checkout, so a new one was not started. No new payment was taken. Try again in a minute.",
          { details: { status: cancelled.status } },
        );
      }
    } else if (latest && !isTerminalStatus(latest.status)) {
      throw new AppError(
        "CONFIGURATION_ERROR",
        "A previous checkout changed state while it was being cleared, so a new one was not started. No new payment was taken. Refresh billing and try again.",
        { details: { status: latest.status } },
      );
    }
  } else if (first && !isTerminalStatus(first.status)) {
    // An unrecognised provider status must never be treated as unpaid.
    throw new AppError(
      "CONFIGURATION_ERROR",
      "A previous checkout is in a state ClipMax does not recognise, so a new one was not started. No new payment was taken. Contact support.",
      { details: { status: first.status } },
    );
  }

  const { data, error } = await admin.rpc("clear_stale_checkout", {
    p_user_id: userId,
    p_attempt_id: decision.attemptId,
    p_subscription_id: decision.subscriptionId,
  });

  const cleared = data as ClearStaleResult | null;

  if (
    error ||
    cleared?.ok !== true ||
    cleared.action !== "create" ||
    typeof cleared.attemptId !== "string"
  ) {
    console.error("[billing] could not clear a stale checkout", {
      code: error?.code,
      message: error?.message,
      cleared,
    });
    throw new AppError(
      "CONFIGURATION_ERROR",
      "The previous checkout changed while it was being cleared, so a new one was not started. No new payment was taken. Refresh billing and try again.",
      { details: { reason: cleared?.reason ?? "clear_failed" } },
    );
  }

  return cleared.attemptId;
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

    // `begin_checkout` takes a per-user transaction lock and returns one honest outcome: manage,
    // reuse, in_progress, stale, or create. It never clears a provider id before the route has
    // resolved the remote state.
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
      throw manageError(decision);
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

    if (decision.action === "in_progress") {
      const retryAfter = Math.max(1, Math.min(decision.retryAfterSeconds ?? 60, 600));
      throw new AppError(
        "RATE_LIMITED",
        "A checkout is already being started for this account. No new payment was taken. Try again in a minute.",
        { details: { retryAfterSeconds: retryAfter } },
      );
    }

    let attemptId: string;

    if (decision.action === "stale") {
      attemptId = await resolveStaleCheckout({ admin, config, userId: user.id, decision });
    } else if (decision.action === "create" && decision.attemptId) {
      // The previous migration returned `create` with an orphan id and cleared the row before the
      // route could verify the remote state. Refuse to run that code path against the new route;
      // deploying the route before applying 20261026120000 would otherwise start a second
      // subscription without cancelling the first.
      const legacy = decision as { orphanSubscriptionId?: string | null };
      if (legacy.orphanSubscriptionId) {
        console.error(
          "[billing] database is missing 20261026120000_backend_hardening; refusing checkout",
          { orphanSubscriptionId: legacy.orphanSubscriptionId },
        );
        throw new AppError(
          "CONFIGURATION_ERROR",
          "Billing is temporarily unavailable while the database is updated. No payment was taken. Try again later.",
        );
      }

      attemptId = decision.attemptId;
    } else {
      console.error("[billing] begin_checkout returned an unknown action", data);
      throw new AppError(
        "INTERNAL_ERROR",
        "Checkout could not be started. No payment was taken. Try again in a moment.",
      );
    }

    let subscription;
    try {
      subscription = await createSubscription(config, {
        userId: user.id,
        email: user.email ?? null,
        attemptId,
      });
    } catch (cause) {
      await admin.rpc("release_checkout_attempt", {
        p_user_id: user.id,
        p_attempt_id: attemptId,
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
    const { data: attached, error: attachError } = await admin.rpc("attach_checkout_subscription", {
      p_user_id: user.id,
      p_attempt_id: attemptId,
      p_subscription_id: subscription.id,
      p_customer_id: subscription.customer_id ?? null,
    });

    if (attachError || attached !== true) {
      console.error("[billing] attach_checkout_subscription failed", {
        code: attachError?.code,
        message: attachError?.message,
        attached,
        subscriptionId: subscription.id,
      });

      try {
        await cancelSubscription(config, subscription.id, false);
      } catch (cause) {
        // The id is logged so an operator can cancel it manually. The subscription was never
        // exposed to the browser, so it cannot be paid through the UI.
        console.error("[billing] could not cancel an unattached subscription", {
          subscriptionId: subscription.id,
          cause,
        });
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
