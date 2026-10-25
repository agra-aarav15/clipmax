import { PLAN_CATALOG } from "@clipmax/shared";
import { NextResponse } from "next/server";

import { getBillingConfig } from "@/lib/payments/config";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Razorpay webhook bodies are small. Refuse anything larger before parsing or storing it. */
const MAX_WEBHOOK_BYTES = 256 * 1024;

type SubscriptionEntity = {
  id: string;
  status?: string;
  customer_id?: string;
  current_start?: number | null;
  current_end?: number | null;
  ended_at?: number | null;
  cancel_at_cycle_end?: boolean | number | null;
};

type PaymentEntity = {
  id: string;
  status?: string;
};

type WebhookBody = {
  event?: string;
  created_at?: number;
  payload?: {
    subscription?: { entity?: SubscriptionEntity };
    payment?: { entity?: PaymentEntity };
  };
};

type StoredStatus = "active" | "past_due" | "canceled" | "pending" | "paused" | "completed";

type StoredSubscription = {
  user_id: string;
  status: string;
  cancel_at_period_end: boolean;
};

type ClaimResult = {
  claimed?: boolean;
  processed?: boolean;
  inProgress?: boolean;
  retryAfterSeconds?: number;
  attempts?: number;
};

type ApplyResult = {
  applied?: boolean;
  reason?: string;
  status?: string;
  cancelAtPeriodEnd?: boolean;
  plan?: string | null;
};

function storedStatus(providerStatus: string | undefined): StoredStatus | null {
  switch (providerStatus) {
    case "active":
      return "active";
    case "authenticated":
    case "created":
    case "pending":
      return "pending";
    case "halted":
      return "past_due";
    case "paused":
      return "paused";
    case "cancelled":
      return "canceled";
    case "completed":
    case "expired":
      return "completed";
    default:
      // An unrecognised provider status must never silently downgrade a paid account.
      return null;
  }
}

function cancelFlag(value: boolean | number | null | undefined): boolean {
  return value === true || value === 1;
}

function toIso(epochSeconds: number | null | undefined): string | null {
  if (typeof epochSeconds !== "number" || !Number.isFinite(epochSeconds)) return null;
  return new Date(epochSeconds * 1000).toISOString();
}

function jsonError(status: number, message: string, headers?: HeadersInit) {
  return NextResponse.json({ received: false, error: message }, { status, headers });
}

/**
 * Reads the body with a hard byte ceiling. `request.text()` would buffer an arbitrarily large body
 * before the signature check, so the cap is enforced while streaming.
 */
async function readLimitedBody(request: Request): Promise<string | null> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_WEBHOOK_BYTES) {
    return null;
  }

  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_WEBHOOK_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(merged);
}

function eventSummary(
  event: string,
  subscription: SubscriptionEntity,
  payment: PaymentEntity | undefined,
  createdAt: number | undefined,
) {
  // Deliberately minimal: no customer PII, no card data, no raw payload.
  return {
    event,
    subscription_id: subscription.id,
    payment_id: payment?.id ?? null,
    status: subscription.status ?? null,
    created_at: createdAt ?? null,
  };
}

export async function POST(request: Request) {
  const config = getBillingConfig();

  if (!config) {
    console.error("[razorpay webhook] billing configuration is incomplete; refusing the event");
    return jsonError(503, "billing_not_configured");
  }

  const signature = request.headers.get("x-razorpay-signature")?.trim();
  if (!signature) return jsonError(400, "missing_signature");

  const rawBody = await readLimitedBody(request);
  if (rawBody === null) {
    console.warn("[razorpay webhook] body exceeded the size limit");
    return jsonError(413, "body_too_large");
  }

  if (
    !verifyWebhookSignature({
      rawBody,
      signature,
      webhookSecret: config.webhookSecret,
    })
  ) {
    console.warn("[razorpay webhook] signature mismatch; event rejected");
    return jsonError(400, "invalid_signature");
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return jsonError(400, "invalid_json");
  }

  const event = body.event;
  if (!event || !event.startsWith("subscription.")) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const subscription = body.payload?.subscription?.entity;
  if (!subscription?.id) return jsonError(400, "missing_subscription");

  const admin = getSupabaseAdminClient();
  if (!admin) {
    console.error("[razorpay webhook] service-role key is missing; refusing the event");
    return jsonError(503, "server_not_configured");
  }

  const payment = body.payload?.payment?.entity;
  const headerEventId = request.headers.get("x-razorpay-event-id")?.trim();
  const eventId =
    headerEventId && headerEventId.length > 0 && headerEventId.length <= 200
      ? headerEventId
      : `${event}:${subscription.id}:${payment?.id ?? subscription.current_start ?? body.created_at ?? "unknown"}`.slice(
          0,
          200,
        );

  const summary = eventSummary(event, subscription, payment, body.created_at);

  // Claim before any side effect. A duplicate delivery then sees the claim and cannot double-grant.
  const { data: claimData, error: claimError } = await admin.rpc("claim_webhook_event", {
    p_provider: "razorpay",
    p_event_id: eventId,
    p_payload: summary,
  });

  if (claimError) {
    console.error("[razorpay webhook] could not claim the event", {
      code: claimError.code,
      message: claimError.message,
    });
    return jsonError(500, "claim_failed");
  }

  const claim = claimData as ClaimResult | null;

  if (!claim || claim.claimed !== true) {
    if (claim?.processed) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (claim?.inProgress) {
      const retryAfter = Math.max(1, Math.min(claim.retryAfterSeconds ?? 120, 300));
      return jsonError(409, "event_in_progress", { "Retry-After": String(retryAfter) });
    }

    console.error("[razorpay webhook] claim returned an unexpected result", claimData);
    return jsonError(500, "claim_failed");
  }

  try {
    // Ownership is resolved only from the subscription id stored before checkout opened. Notes are
    // not trusted for routing, and an unknown id is acknowledged rather than retried forever.
    const { data: stored, error: lookupError } = await admin
      .from("subscriptions")
      .select("user_id, status, cancel_at_period_end")
      .eq("provider", "razorpay")
      .eq("provider_subscription_id", subscription.id)
      .maybeSingle<StoredSubscription>();

    if (lookupError) throw lookupError;

    if (!stored) {
      console.warn("[razorpay webhook] event for an unknown subscription; acknowledging", {
        event,
        subscriptionId: subscription.id,
      });

      await admin.rpc("complete_webhook_event", {
        p_provider: "razorpay",
        p_event_id: eventId,
        p_payload: { ...summary, ignored: "unknown_subscription" },
      });

      return NextResponse.json({ received: true, ignored: true });
    }

    const nextStatus = storedStatus(subscription.status);
    let applied: ApplyResult | null = null;

    if (nextStatus) {
      const { data: applyData, error: applyError } = await admin.rpc(
        "apply_subscription_event",
        {
          p_user_id: stored.user_id,
          p_provider_subscription_id: subscription.id,
          p_customer_id: subscription.customer_id ?? null,
          p_status: nextStatus,
          p_current_period_end: toIso(subscription.current_end),
          p_cancel_at_period_end: cancelFlag(subscription.cancel_at_cycle_end),
          p_event_at: toIso(body.created_at) ?? new Date().toISOString(),
          p_event_id: eventId,
        },
      );

      if (applyError) throw applyError;
      applied = applyData as ApplyResult | null;
    }

    let granted = false;

    if (event === "subscription.charged" && applied?.reason !== "not_found") {
      const credits = PLAN_CATALOG.starter.creditsPerMonth;
      const cycleKey = subscription.current_start ?? subscription.current_end ?? body.created_at;
      const grantKey = payment?.id
        ? `razorpay:${subscription.id}:${payment.id}`
        : `razorpay:${subscription.id}:cycle:${cycleKey ?? "unknown"}`;

      const { error: grantError } = await admin.rpc("grant_credits", {
        p_user_id: stored.user_id,
        p_credits: credits,
        p_reason: "grant_purchase",
        p_idempotency_key: grantKey,
        p_metadata: {
          provider: "razorpay",
          subscription_id: subscription.id,
          payment_id: payment?.id ?? null,
          cycle_start: subscription.current_start ?? null,
          cycle_end: subscription.current_end ?? null,
        },
      });

      if (grantError) throw grantError;
      granted = true;
    }

    await admin.rpc("complete_webhook_event", {
      p_provider: "razorpay",
      p_event_id: eventId,
      p_payload: {
        ...summary,
        applied: applied ?? null,
        granted,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[razorpay webhook] processing failed", error);

    const { error: failError } = await admin.rpc("fail_webhook_event", {
      p_provider: "razorpay",
      p_event_id: eventId,
      p_error: message.slice(0, 2000),
    });

    if (failError) {
      console.error("[razorpay webhook] could not record the failure", {
        code: failError.code,
        message: failError.message,
      });
    }

    return jsonError(500, "processing_failed");
  }
}
