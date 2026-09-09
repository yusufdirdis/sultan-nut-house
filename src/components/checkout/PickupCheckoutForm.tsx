"use client";

import { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { startPickupCheckout } from "@/server/actions/checkout-actions";
import { getStripeClient } from "@/lib/stripe-client";
import { PickupPaymentStep } from "@/components/checkout/PickupPaymentStep";

export function PickupCheckoutForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<{ clientSecret: string; orderNumber: string } | null>(null);

  async function handleContinue() {
    setIsSubmitting(true);
    setError(null);

    const result = await startPickupCheckout({ contactName: name, contactEmail: email, contactPhone: phone, notes });
    setIsSubmitting(false);

    if (!result.success || !result.data) {
      setError(result.message ?? "We couldn't start checkout.");
      return;
    }

    setPayment(result.data);
  }

  if (payment) {
    return (
      <Elements stripe={getStripeClient()} options={{ clientSecret: payment.clientSecret }}>
        <PickupPaymentStep orderNumber={payment.orderNumber} />
      </Elements>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-espresso-soft">Picking up ASAP at Sultan Nut House, 1836 N University Dr, Plantation, FL.</p>
      <TextField id="pickup-name" label="Full name" required value={name} onChange={(e) => setName(e.target.value)} />
      <TextField id="pickup-email" label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField id="pickup-phone" label="Phone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-espresso" htmlFor="pickup-notes">
          Notes for the cafe (optional)
        </label>
        <textarea
          id="pickup-notes"
          rows={2}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="rounded-xl border border-espresso/20 bg-white px-4 py-3 text-base text-espresso outline-none focus:border-brass"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="button"
        variant="brass"
        size="lg"
        disabled={isSubmitting || !name || !email || !phone}
        onClick={handleContinue}
        className="disabled:opacity-60"
      >
        {isSubmitting ? "Preparing payment…" : "Continue to payment"}
      </Button>
    </div>
  );
}
