import { z } from "zod";

import { requireAdminClient, requireUser } from "@/lib/api/auth";
import { AppError } from "@/lib/api/errors";
import { handleRoute, jsonOk } from "@/lib/api/response";
import { getBillingConfig, MISSING_BILLING_ENV } from "@/lib/payments/config";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { verifyCheckoutSignature } from "@/lib/payments/razorpay";
import type { BillingVerifyResponse } from "@clipmax/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  razorpay_payment_id: z.string().min(1).max(128),
  razorpay_subscription_id: z.string().min(1).max(128),
  razorpay_signature: z.string().min(1).max(256),
});

export async function POST(request: Request) {
  return handleRoute(async () => {
    const { supabase, user } = await requireUser();
    const admin = requireAdminClient();
    await enforceRateLimit(admin, RATE_LIMITS.verify, user.id);

    const config = getBillingConfig();

    if (!config) {
      throw new AppError(
        "CONFIGURATION_ERROR",
        `Billing is not configured. Add ${MISSING_BILLING_ENV.join(", ")}.`,
      );
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", "Razorpay did not return a complete payment result.", {
        status: 400,
        details: parsed.error.issues,
      });
    }

    // Razorpay requires the subscription id that this server created, not the value echoed by
    // Checkout. The checkout route stores it before the browser is allowed to pay.
    const { data: stored, error: storedError } = await supabase
      .from("subscriptions")
      .select("provider_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle<{ provider_subscription_id: string | null }>();

    if (storedError) {
      throw new AppError("INTERNAL_ERROR", "Could not read the pending subscription.", {
        details: storedError.message,
      });
    }

    if (!stored?.provider_subscription_id) {
      throw new AppError(
        "VALIDATION_ERROR",
        "No Razorpay checkout is recorded for this account. Start the upgrade again.",
        { status: 400 },
      );
    }

    if (stored.provider_subscription_id !== parsed.data.razorpay_subscription_id) {
      throw new AppError(
        "VALIDATION_ERROR",
        "The payment does not match the subscription this account started.",
        { status: 400 },
      );
    }

    const verified = verifyCheckoutSignature({
      paymentId: parsed.data.razorpay_payment_id,
      subscriptionId: stored.provider_subscription_id,
      signature: parsed.data.razorpay_signature,
      keySecret: config.keySecret,
    });

    if (!verified) {
      throw new AppError("VALIDATION_ERROR", "The payment signature is invalid.", { status: 400 });
    }

    // Credits are granted only by the webhook. This endpoint reports whether that grant exists so
    // the UI can say "waiting for confirmation" instead of claiming a fake success.
    const grantKey = `razorpay:${stored.provider_subscription_id}:${parsed.data.razorpay_payment_id}`;
    const { data: grant } = await supabase
      .from("credit_ledger")
      .select("id")
      .eq("user_id", user.id)
      .eq("idempotency_key", grantKey)
      .maybeSingle<{ id: string }>();

    const response: BillingVerifyResponse = {
      verified: true,
      granted: Boolean(grant),
    };

    return jsonOk(response);
  });
}
