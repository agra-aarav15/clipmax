"use client";

import type { BillingCheckoutResponse, BillingVerifyResponse } from "@clipmax/shared";
import { CheckCircle2Icon, CreditCardIcon, Loader2Icon, TriangleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: { description?: string; reason?: string };
};

type RazorpayOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  image?: string;
  prefill?: { email?: string };
  theme?: { color?: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SCRIPT}"]`);

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Razorpay Checkout failed to load.")),
        {
          once: true,
        },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Razorpay Checkout failed to load. Check your network."));
    document.body.appendChild(script);
  });
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {
    // fall through
  }
  return `Request failed (${response.status}).`;
}

export function UpgradeButton({
  email,
  testMode,
  label = "Upgrade to Starter",
}: {
  email: string | null;
  testMode: boolean;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function verifyPayment(response: RazorpayHandlerResponse) {
    setBusy(true);
    setMessage("Verifying the payment signature…");

    try {
      const verifyResponse = await fetch("/api/billing/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      });

      if (!verifyResponse.ok) {
        setError(await errorMessage(verifyResponse));
        return;
      }

      const result = (await verifyResponse.json()) as BillingVerifyResponse;

      if (result.granted) {
        setMessage("Payment verified and credits granted.");
      } else {
        setMessage(
          "Payment signature verified. Waiting for the Razorpay webhook to confirm the charge and grant credits.",
        );
        window.setTimeout(() => router.refresh(), 4000);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not verify the payment.");
    } finally {
      setBusy(false);
    }
  }

  async function startCheckout() {
    setBusy(true);
    setError(null);
    setMessage("Creating a Razorpay subscription…");

    try {
      const response = await fetch("/api/billing/checkout", { method: "POST" });

      if (!response.ok) {
        setError(await errorMessage(response));
        return;
      }

      const checkout = (await response.json()) as BillingCheckoutResponse;
      await loadCheckoutScript();

      if (!window.Razorpay) {
        setError("Razorpay Checkout loaded but did not initialise. Try again.");
        return;
      }

      setMessage("Opening secure checkout…");

      const razorpay = new window.Razorpay({
        key: checkout.keyId,
        subscription_id: checkout.subscriptionId,
        name: "ClipMax",
        description: `${checkout.planName} · ${checkout.credits} credits / month`,
        image: "/icon.svg",
        prefill: email ? { email } : undefined,
        theme: { color: "#155EEF" },
        handler: (result) => {
          void verifyPayment(result);
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setMessage(null);
          },
        },
      });

      razorpay.on("payment.failed", (failure) => {
        const description = (failure as RazorpayFailureResponse).error?.description;
        setBusy(false);
        setError(description ?? "Razorpay reported a failed payment.");
      });

      razorpay.open();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Checkout could not be opened.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button type="button" size="lg" className="w-full" onClick={startCheckout} disabled={busy}>
        {busy ? <Loader2Icon className="animate-spin" /> : <CreditCardIcon />}
        {busy ? "Working" : label}
      </Button>

      {testMode ? (
        <p className="text-center font-mono text-[0.625rem] tracking-[0.1em] text-amber-200/80 uppercase">
          Razorpay test mode · no live money moves
        </p>
      ) : null}

      {message ? (
        <p className="flex items-start gap-2 rounded-lg border border-signal/20 bg-signal/[0.05] px-3 py-2.5 text-xs leading-relaxed text-signal">
          <CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0" />
          {message}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive"
        >
          <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
