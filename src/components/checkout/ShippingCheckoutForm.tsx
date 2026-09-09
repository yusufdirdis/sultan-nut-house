"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { quoteShipping, startShippingCheckout } from "@/server/actions/checkout-actions";
import { formatCents } from "@/lib/money";
import type { ShippingAddressInput } from "@/validation/checkout";
import type { ShippingRateOption } from "@/integrations/shipping/types";

const emptyAddress: ShippingAddressInput = {
  recipientName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
  phone: "",
};

export function ShippingCheckoutForm({ subtotalCents }: { subtotalCents: number }) {
  const [step, setStep] = useState<"address" | "rates">("address");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<ShippingAddressInput>(emptyAddress);
  const [rates, setRates] = useState<ShippingRateOption[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRate = rates.find((rate) => rate.id === selectedRateId);

  async function handleGetRates() {
    setError(null);
    setIsLoadingRates(true);
    const result = await quoteShipping(address);
    setIsLoadingRates(false);

    if (!result.success || !result.data) {
      setError(result.message ?? "We couldn't calculate shipping.");
      return;
    }

    setRates(result.data);
    setSelectedRateId(result.data[0]?.id ?? null);
    setStep("rates");
  }

  async function handlePlaceOrder() {
    if (!selectedRate) return;
    setError(null);
    setIsPlacingOrder(true);

    const result = await startShippingCheckout({
      contactEmail: email,
      shippingAddress: address,
      rateId: selectedRate.id,
      carrier: selectedRate.carrier,
      serviceName: selectedRate.serviceName,
      amountCents: selectedRate.amountCents,
    });

    if (!result.success || !result.data) {
      setIsPlacingOrder(false);
      setError(result.message ?? "We couldn't start checkout.");
      return;
    }

    window.location.assign(result.data.redirectUrl);
  }

  if (step === "address") {
    return (
      <div className="flex flex-col gap-5">
        <TextField id="checkout-email" label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField
          id="checkout-name"
          label="Full name"
          required
          value={address.recipientName}
          onChange={(e) => setAddress((a) => ({ ...a, recipientName: e.target.value }))}
        />
        <TextField
          id="checkout-line1"
          label="Address"
          required
          value={address.line1}
          onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
        />
        <TextField
          id="checkout-line2"
          label="Apt, suite, etc. (optional)"
          value={address.line2}
          onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
        />
        <div className="grid grid-cols-3 gap-4">
          <TextField
            id="checkout-city"
            label="City"
            required
            value={address.city}
            onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
          />
          <TextField
            id="checkout-state"
            label="State"
            required
            maxLength={2}
            placeholder="FL"
            value={address.state}
            onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value.toUpperCase() }))}
          />
          <TextField
            id="checkout-zip"
            label="ZIP"
            required
            value={address.postalCode}
            onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))}
          />
        </div>
        <TextField
          id="checkout-phone"
          label="Phone (optional)"
          value={address.phone}
          onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          type="button"
          variant="brass"
          size="lg"
          disabled={isLoadingRates || !email || !address.recipientName || !address.line1 || !address.city || !address.state || !address.postalCode}
          onClick={handleGetRates}
          className="disabled:opacity-60"
        >
          {isLoadingRates ? "Calculating shipping…" : "Continue to shipping"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm font-medium text-espresso">Shipping to</p>
        <p className="text-sm text-espresso-soft">
          {address.recipientName}, {address.line1}, {address.city}, {address.state} {address.postalCode}
        </p>
        <button type="button" onClick={() => setStep("address")} className="mt-1 text-sm text-brass hover:underline">
          Edit address
        </button>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-espresso">Shipping method</legend>
        {rates.map((rate) => (
          <label
            key={rate.id}
            className="flex cursor-pointer items-center justify-between rounded-xl border border-line px-4 py-3 text-sm has-[:checked]:border-brass has-[:checked]:bg-brass/5"
          >
            <span className="flex items-center gap-3">
              <input type="radio" name="rate" checked={selectedRateId === rate.id} onChange={() => setSelectedRateId(rate.id)} />
              <span>
                {rate.carrier} {rate.serviceName}
                {rate.estimatedDays && <span className="text-espresso-soft"> · {rate.estimatedDays} business days</span>}
              </span>
            </span>
            <span className="font-medium text-espresso">{formatCents(rate.amountCents)}</span>
          </label>
        ))}
      </fieldset>

      {selectedRate && (
        <div className="rounded-xl border border-line bg-cream-deep p-4 text-sm text-espresso-soft">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCents(subtotalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{formatCents(selectedRate.amountCents)}</span>
          </div>
          <p className="mt-1 text-xs">Tax calculated at checkout.</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="button"
        variant="brass"
        size="lg"
        disabled={isPlacingOrder || !selectedRate}
        onClick={handlePlaceOrder}
        className="disabled:opacity-60"
      >
        {isPlacingOrder ? "Redirecting to payment…" : "Continue to payment"}
      </Button>
    </div>
  );
}
