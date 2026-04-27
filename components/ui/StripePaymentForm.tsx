"use client";

import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";

interface Props {
  onPaymentSuccess: (paymentIntentId: string) => void;
  loading: boolean; // outer order-placing loading
}

export default function StripePaymentForm({ onPaymentSuccess, loading }: Props) {
  const stripe   = useStripe();
  const elements = useElements();
  const [error,      setError]      = useState("");
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setError("");
    setProcessing(true);

    // Validate the Payment Element before confirming
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Invalid card details.");
      setProcessing(false);
      return;
    }

    // Confirm the payment — stay on page (no redirect for card payments)
    const { paymentIntent, error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onPaymentSuccess(paymentIntent.id);
    } else {
      setError("Payment was not completed. Please try again.");
    }

    setProcessing(false);
  };

  const busy = processing || loading;

  return (
    <div className="flex flex-col gap-4">
      {/* Stripe Payment Element — card, wallets, etc. */}
      <div className="rounded-xl border border-gray-200 p-4 bg-white">
        <PaymentElement
          options={{
            layout: "tabs",
            fields: { billingDetails: { name: "never", email: "never" } },
          }}
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          ⚠️ {error}
        </p>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={!stripe || busy}
        className="w-full py-3.5 bg-[#635bff] hover:bg-[#4f46e5] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {busy ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
        ) : (
          <><Lock className="w-3.5 h-3.5" /> Pay Securely with Stripe</>
        )}
      </button>

      <p className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" /> Secured by Stripe. Your card info is never stored on our servers.
      </p>
    </div>
  );
}
