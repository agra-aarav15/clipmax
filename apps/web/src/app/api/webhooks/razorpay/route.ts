import { PLAN_CATALOG } from "@clipmax/shared";
import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getBillingConfig } from "@/lib/payments/config";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriptionEntity = {
  id: string;
  status?: string;
  customer_id?: string;
  current_start?: number | null;
  current_end?: number | null;
  ended_at?: number | null;
  notes?: unknown;
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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function noteUserId(notes: unknown): string | null {
  if (!notes || typeof notes !== "object" || Array.isArray(notes)) return null;
  const value = (notes as Record<string, unknown>).user_id;
  return typeof value === "string" && UUID_PATTERN.test(value) ? value : null;
}

function storedStatus(providerStatus: string | undefined): StoredStatus {
  switch (providerStatus) {
    case "active":
      return "active";
    case "authenticated":
    case "created":
      return "pending";
    case "pending":
    case "halted":
      return "past_due";
    case "paused":
      return "paused";
    case "cancelled":
      return "canceled";
    case "completed":
      return "completed";
    default:
      return "pending";
  }
}

function planAfterStatus(status: StoredStatus): "free" | "starter" | null {
  if (status === "active") return "starter";
  if (status === "canceled" || status === "completed") return "free";
  // pending / past_due / paused: keep the plan label until the subscription is really over.
  return null;
}

function toIso(epochSeconds: number | null | undefined): string | null {
  if (typeof epochSeconds !== "number" || !Number.isFinite(epochSeconds)) return null;
  return new Date(epochSeconds * 1000).toISOString();
}

function jsonError(status: number, message: string) {
  return NextResponse.json({ received: false, error: message }, { status });
}

export async function POST(request: Request) {
  const config = getBillingConfig();

  if (!config) {
    console.error("[razorpay webhook] billing configuration is incomplete; refusing the event");
    return jsonError(503, "billing_not_configured");
  }

  const signature = request.headers.get("x-razorpay-signature")?.trim();
  if (!signature) return jsonError(400, "missing_signature");

  const rawBody = await request.text();

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
    headerEventId && headerEventId.length <= 200
      ? headerEventId
      : `${event}:${subscription.id}:${payment?.id ?? subscription.current_start ?? body.created_at ?? "unknown"}`;

  try {
    const { data: existing, error: lookupError } = await admin
      .from("subscriptions")
      .select("user_id, status")
      .eq("provider", "razorpay")
      .eq("provider_subscription_id", subscription.id)
      .maybeSingle<{ user_id: string; status: string }>();

    if (lookupError) throw lookupError;

    const userId = existing?.user_id ?? noteUserId(subscription.notes);
    if (!userId) {
      throw new Error(
        `Razorpay subscription ${subscription.id} has no ClipMax owner in notes or subscriptions`,
      );
    }

    let status = storedStatus(subscription.status);
    const periodEnd = toIso(subscription.current_end);

    // Razorpay can deliver an older event after a newer one. Never let an authentication step
    // downgrade an active subscription, and never reopen a terminal one from a stale event.
    const terminal = existing?.status === "canceled" || existing?.status === "completed";
    if (terminal && event !== "subscription.cancelled" && event !== "subscription.completed") {
      status = existing?.status === "completed" ? "completed" : "canceled";
    } else if (event === "subscription.authenticated" && existing?.status === "active") {
      status = "active";
    }

    const { error: upsertError } = await admin.from("subscriptions").upsert(
      {
        user_id: userId,
        provider: "razorpay",
        provider_customer_id: subscription.customer_id ?? null,
        provider_subscription_id: subscription.id,
        plan: "starter",
        status,
        current_period_end: periodEnd,
      },
      { onConflict: "user_id" },
    );

    if (upsertError) throw upsertError;

    if (event === "subscription.charged") {
      const credits = PLAN_CATALOG.starter.creditsPerMonth;
      const cycleKey = subscription.current_start ?? subscription.current_end ?? body.created_at;
      const grantKey = payment?.id
        ? `razorpay:${subscription.id}:${payment.id}`
        : `razorpay:${subscription.id}:cycle:${cycleKey ?? "unknown"}`;

      const { error: grantError } = await admin.rpc("grant_credits", {
        p_user_id: userId,
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
    }

    const nextPlan = planAfterStatus(status);
    if (nextPlan) {
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .update({ plan: nextPlan })
        .eq("id", userId)
        .select("id")
        .maybeSingle<{ id: string }>();

      if (profileError) throw profileError;
      if (!profile) throw new Error(`profile missing for user ${userId}`);
    }

    // Store a minimal event summary, not the raw payload: Razorpay includes customer PII and card
    // metadata in the body, and webhook_events is an audit table, not a payment archive.
    const { error: auditError } = await admin.from("webhook_events").insert({
      provider: "razorpay",
      event_id: eventId,
      payload: {
        event,
        subscription_id: subscription.id,
        payment_id: payment?.id ?? null,
        status: subscription.status ?? null,
        created_at: body.created_at ?? null,
      },
      processed_at: new Date().toISOString(),
    });

    if (auditError && auditError.code !== "23505") {
      // The grant already happened; a failed audit insert must not cause a duplicate retry loop.
      console.error("[razorpay webhook] could not record the event summary", auditError.message);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[razorpay webhook] processing failed", error);
    return jsonError(500, "processing_failed");
  }
}
