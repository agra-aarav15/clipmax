import { createHmac, timingSafeEqual } from "node:crypto";

import type { BillingConfig } from "./config";

const RAZORPAY_API = "https://api.razorpay.com/v1";

type RazorpayErrorBody = {
  error?: { description?: string; code?: string };
};

type RazorpaySubscription = {
  id: string;
  status?: string;
  customer_id?: string;
  short_url?: string | null;
};

function apiError(status: number, body: string): Error {
  let description = `Razorpay returned HTTP ${status}.`;

  try {
    const parsed = JSON.parse(body) as RazorpayErrorBody;
    if (parsed.error?.description) description = parsed.error.description;
  } catch {
    // Keep the status-based message.
  }

  return new Error(description);
}

/**
 * Creates a monthly subscription for one user.
 *
 * `notes.user_id` is the server-controlled link between a Razorpay subscription and a ClipMax
 * account. The checkout route also stores the subscription id against the user, so the webhook can
 * resolve the owner even if notes are omitted.
 */
export async function createSubscription(
  config: BillingConfig,
  input: { userId: string; email: string | null },
): Promise<RazorpaySubscription> {
  const basic = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");

  let response: Response;
  try {
    response = await fetch(`${RAZORPAY_API}/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: config.planId,
        // Razorpay allows at most 100 billing cycles. At one cycle per month this is over 8 years,
        // which is effectively open-ended for this product. Cancelling is always available.
        total_count: 100,
        quantity: 1,
        customer_notify: 1,
        notes: {
          user_id: input.userId,
          ...(input.email ? { email: input.email } : {}),
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (cause) {
    throw new Error("Could not reach Razorpay. Check the network and try again.", { cause });
  }

  const body = await response.text();

  if (!response.ok) {
    throw apiError(response.status, body);
  }

  let parsed: RazorpaySubscription;
  try {
    parsed = JSON.parse(body) as RazorpaySubscription;
  } catch (cause) {
    throw new Error("Razorpay returned an unreadable subscription response.", { cause });
  }

  if (!parsed.id) {
    throw new Error("Razorpay did not return a subscription id.");
  }

  return parsed;
}

function safeCompare(expected: Buffer, providedHex: string): boolean {
  if (!/^[0-9a-f]{64}$/i.test(providedHex)) return false;

  const provided = Buffer.from(providedHex, "hex");
  if (provided.length !== expected.length) return false;

  return timingSafeEqual(expected, provided);
}

/** Checkout signature: HMAC-SHA256 of `payment_id|subscription_id` with the key secret. */
export function verifyCheckoutSignature(input: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
  keySecret: string;
}): boolean {
  const expected = createHmac("sha256", input.keySecret)
    .update(`${input.paymentId}|${input.subscriptionId}`)
    .digest();

  return safeCompare(expected, input.signature);
}

/** Webhook signature: HMAC-SHA256 of the raw request body with the webhook secret. */
export function verifyWebhookSignature(input: {
  rawBody: string;
  signature: string;
  webhookSecret: string;
}): boolean {
  const expected = createHmac("sha256", input.webhookSecret).update(input.rawBody).digest();
  return safeCompare(expected, input.signature);
}
