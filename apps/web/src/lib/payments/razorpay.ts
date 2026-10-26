import { createHmac, timingSafeEqual } from "node:crypto";

import type { BillingConfig } from "./config";

const RAZORPAY_API = "https://api.razorpay.com/v1";

type RazorpayErrorBody = {
  error?: { description?: string; code?: string };
};

export type RazorpaySubscription = {
  id: string;
  status?: string;
  customer_id?: string;
  short_url?: string | null;
  current_start?: number | null;
  current_end?: number | null;
  cancel_at_cycle_end?: boolean | number | null;
  paid_count?: number | null;
};

export class RazorpayApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "RazorpayApiError";
    this.status = status;
  }
}

function apiError(status: number, body: string): RazorpayApiError {
  let description = `Razorpay returned HTTP ${status}.`;

  try {
    const parsed = JSON.parse(body) as RazorpayErrorBody;
    if (parsed.error?.description) description = parsed.error.description;
  } catch {
    // Keep the status-based message.
  }

  return new RazorpayApiError(status, description);
}

function basicAuth(config: BillingConfig): string {
  return Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");
}

function assertSubscriptionId(subscriptionId: string): void {
  if (!/^sub_[A-Za-z0-9]+$/.test(subscriptionId)) {
    throw new Error("The stored Razorpay subscription id is not valid.");
  }
}

/**
 * Creates a monthly subscription for one user.
 *
 * `notes.user_id` is the server-controlled link between a Razorpay subscription and a ClipMax
 * account. The checkout route also stores the subscription id against the user, so the webhook can
 * resolve the owner even if notes are omitted. `notes.attempt_id` lets the route prove which local
 * checkout attempt a remote subscription belongs to.
 */
export async function createSubscription(
  config: BillingConfig,
  input: { userId: string; email: string | null; attemptId: string },
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
          attempt_id: input.attemptId,
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

/**
 * Reads the live state of a subscription from Razorpay.
 *
 * Returns `null` when Razorpay does not know the id (for example a key-mode change or a deleted
 * test subscription). Every other failure throws, because guessing at a remote state could cancel a
 * paid subscription or start a second one.
 */
export async function fetchSubscription(
  config: BillingConfig,
  subscriptionId: string,
): Promise<RazorpaySubscription | null> {
  assertSubscriptionId(subscriptionId);

  let response: Response;
  try {
    response = await fetch(`${RAZORPAY_API}/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${basicAuth(config)}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (cause) {
    throw new Error("Could not reach Razorpay to verify the previous checkout.", { cause });
  }

  const body = await response.text();

  if (response.status === 404) return null;
  if (!response.ok) throw apiError(response.status, body);

  let parsed: RazorpaySubscription;
  try {
    parsed = JSON.parse(body) as RazorpaySubscription;
  } catch (cause) {
    throw new Error("Razorpay returned an unreadable subscription response.", { cause });
  }

  if (!parsed.id) {
    throw new Error("Razorpay returned a subscription without an id.");
  }

  return parsed;
}

/**
 * Cancels a subscription through Razorpay. `atCycleEnd` keeps access until the paid period ends;
 * an unpaid pending checkout is cancelled immediately so it can never charge later.
 */
export async function cancelSubscription(
  config: BillingConfig,
  subscriptionId: string,
  atCycleEnd: boolean,
): Promise<{ status?: string; current_end?: number | null }> {
  assertSubscriptionId(subscriptionId);

  let response: Response;
  try {
    response = await fetch(
      `${RAZORPAY_API}/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth(config)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cancel_at_cycle_end: atCycleEnd ? 1 : 0 }),
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch (cause) {
    throw new Error("Could not reach Razorpay to cancel the subscription.", { cause });
  }

  const body = await response.text();
  if (!response.ok) throw apiError(response.status, body);

  try {
    return JSON.parse(body) as { status?: string; current_end?: number | null };
  } catch {
    return {};
  }
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
