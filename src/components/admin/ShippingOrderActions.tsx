"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { buyShippingLabel, setTrackingManually } from "@/server/actions/admin-order-actions";

interface Props {
  orderId: string;
  hasRate: boolean;
  alreadyLabeled: boolean;
}

export function ShippingOrderActions({ orderId, hasRate, alreadyLabeled }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("USPS");

  function handleBuyLabel() {
    setError(null);
    startTransition(async () => {
      const result = await buyShippingLabel(orderId);
      if (!result.success) setError(result.message ?? "Failed to buy label.");
      router.refresh();
    });
  }

  function handleSaveManualTracking() {
    if (!trackingNumber) return;
    setError(null);
    startTransition(async () => {
      const result = await setTrackingManually(orderId, trackingNumber, carrier);
      if (!result.success) setError(result.message ?? "Failed to save tracking.");
      else setShowManual(false);
      router.refresh();
    });
  }

  if (alreadyLabeled) {
    return <p className="text-sm text-pistachio">Label purchased</p>;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {hasRate && (
          <Button type="button" size="md" variant="brass" disabled={isPending} onClick={handleBuyLabel} className="disabled:opacity-60">
            {isPending ? "Buying…" : "Buy label"}
          </Button>
        )}
        <Button type="button" size="md" variant="outline" disabled={isPending} onClick={() => setShowManual((s) => !s)}>
          Enter tracking
        </Button>
      </div>

      {showManual && (
        <div className="flex flex-col items-end gap-2 rounded-xl border border-line bg-cream-deep p-3">
          <select value={carrier} onChange={(e) => setCarrier(e.target.value)} className="h-9 rounded-lg border border-espresso/20 px-2 text-sm">
            <option>USPS</option>
            <option>UPS</option>
            <option>FedEx</option>
          </select>
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Tracking number"
            className="h-9 w-48 rounded-lg border border-espresso/20 px-2 text-sm"
          />
          <Button type="button" size="md" variant="brass" disabled={isPending || !trackingNumber} onClick={handleSaveManualTracking}>
            Save &amp; mark shipped
          </Button>
        </div>
      )}

      {error && <p className="max-w-xs text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
