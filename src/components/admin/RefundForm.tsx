"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { formatCents } from "@/lib/money";
import { computeRefund, fullRefundSelection, type RefundableLine, type RefundOrderTotals } from "@/domain/orders/computeRefund";
import { refundOrder } from "@/server/actions/admin-refund-actions";

export interface RefundFormLine extends RefundableLine {
  name: string;
  variant: string;
}

interface Props {
  orderId: string;
  totals: RefundOrderTotals;
  lines: RefundFormLine[];
  /** Set when this order can't be refunded from here, with the reason to show. */
  blockedReason?: string;
}

const REASONS = [
  { value: "requested_by_customer", label: "Customer request" },
  { value: "duplicate", label: "Duplicate charge" },
  { value: "fraudulent", label: "Fraudulent" },
] as const;

export function RefundForm({ orderId, totals, lines, blockedReason }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [includeShipping, setIncludeShipping] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]["value"]>("requested_by_customer");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selected = useMemo(
    () => ({
      lines: lines.map((line) => ({ id: line.id, quantity: quantities[line.id] ?? 0 })),
      includeShipping,
    }),
    [lines, quantities, includeShipping],
  );
  const preview = computeRefund(totals, lines, selected);
  const nothingSelected = selected.lines.every((l) => l.quantity === 0) && !includeShipping;

  const fullSelection = fullRefundSelection(lines, totals.shippingRefunded);
  const fullPreview = computeRefund(totals, lines, fullSelection);

  if (blockedReason) {
    // The refund that finishes off an order lands here after the refresh, so
    // keep showing its confirmation instead of silently swapping the form out.
    return (
      <div className="flex flex-col gap-2">
        {success && <p className="text-sm text-pistachio">{success}</p>}
        <p className="text-sm text-espresso-soft">{blockedReason}</p>
      </div>
    );
  }

  function submit(mode: "FULL" | "ITEMS", amountCents: number) {
    const what = mode === "FULL" ? "everything still refundable on this order" : "the selected items";
    if (!window.confirm(`Refund ${formatCents(amountCents)} for ${what} to the customer's card? This can't be undone.`)) return;

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await refundOrder({
        orderId,
        mode,
        lines: mode === "ITEMS" ? selected.lines.filter((l) => l.quantity > 0).map((l) => ({ orderItemId: l.id, quantity: l.quantity })) : [],
        includeShipping: mode === "ITEMS" ? includeShipping : false,
        reason,
        note: note || undefined,
      });

      if (!result.success) {
        setError(result.message ?? "The refund didn't go through.");
        return;
      }

      setSuccess(result.message ?? "Refund issued.");
      setQuantities({});
      setIncludeShipping(false);
      setNote("");
      router.refresh();
    });
  }

  function toggleLine(line: RefundFormLine, checked: boolean) {
    const remaining = line.quantity - line.refundedQuantity;
    setQuantities((q) => ({ ...q, [line.id]: checked ? remaining : 0 }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col divide-y divide-line rounded-xl border border-line">
        {lines.map((line) => {
          const remaining = line.quantity - line.refundedQuantity;
          const qty = quantities[line.id] ?? 0;
          const checked = qty > 0;

          return (
            <label key={line.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${remaining === 0 ? "opacity-50" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                checked={checked}
                disabled={remaining === 0 || isPending}
                onChange={(event) => toggleLine(line, event.target.checked)}
                className="h-4 w-4"
              />
              <span className="min-w-0 flex-1 text-sm text-espresso">
                {line.name} <span className="text-espresso-soft">({line.variant})</span>
                <span className="block text-xs text-espresso-soft">
                  {line.quantity}× {formatCents(line.unitCents)} each
                  {line.refundedQuantity > 0 && ` · ${line.refundedQuantity} already refunded`}
                </span>
              </span>
              {checked && remaining > 1 && (
                <select
                  value={qty}
                  disabled={isPending}
                  onChange={(event) => setQuantities((q) => ({ ...q, [line.id]: Number(event.target.value) }))}
                  className="h-9 rounded-lg border border-espresso/20 px-2 text-sm"
                  aria-label={`Quantity of ${line.name} to refund`}
                >
                  {Array.from({ length: remaining }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Refund {n} of {remaining}
                    </option>
                  ))}
                </select>
              )}
              <span className="w-20 text-right text-sm text-espresso">{formatCents(line.unitCents * (checked ? qty : remaining))}</span>
            </label>
          );
        })}

        {totals.shippingCents > 0 && (
          <label className={`flex items-center gap-3 px-4 py-3 ${totals.shippingRefunded ? "opacity-50" : "cursor-pointer"}`}>
            <input
              type="checkbox"
              checked={includeShipping}
              disabled={totals.shippingRefunded || isPending}
              onChange={(event) => setIncludeShipping(event.target.checked)}
              className="h-4 w-4"
            />
            <span className="flex-1 text-sm text-espresso">
              Shipping
              {totals.shippingRefunded && <span className="block text-xs text-espresso-soft">Already refunded</span>}
            </span>
            <span className="w-20 text-right text-sm text-espresso">{formatCents(totals.shippingCents)}</span>
          </label>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-espresso">
          Reason
          <select
            value={reason}
            disabled={isPending}
            onChange={(event) => setReason(event.target.value as typeof reason)}
            className="h-11 rounded-xl border border-espresso/20 bg-white px-3 text-sm font-normal"
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-espresso">
          Internal note (optional)
          <input
            value={note}
            maxLength={500}
            disabled={isPending}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. arrived damaged"
            className="h-11 rounded-xl border border-espresso/20 bg-white px-3 text-sm font-normal"
          />
        </label>
      </div>

      <div className="rounded-xl bg-cream-deep px-4 py-3 text-sm text-espresso">
        {nothingSelected ? (
          <span className="text-espresso-soft">Pick the items (and shipping, if applicable) to refund.</span>
        ) : preview.ok ? (
          <>
            <span className="font-medium">Refund total: {formatCents(preview.totalCents)}</span>
            <span className="text-espresso-soft">
              {" "}
              — items {formatCents(preview.itemsCents)}
              {preview.taxCents > 0 && `, tax ${formatCents(preview.taxCents)}`}
              {preview.shippingCents > 0 && `, shipping ${formatCents(preview.shippingCents)}`}
            </span>
          </>
        ) : (
          <span className="text-red-600">{preview.error}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="md"
          variant="brass"
          disabled={isPending || !preview.ok || nothingSelected}
          className="disabled:opacity-60"
          onClick={() => preview.ok && submit("ITEMS", preview.totalCents)}
        >
          {isPending ? "Refunding…" : preview.ok && !nothingSelected ? `Refund ${formatCents(preview.totalCents)}` : "Refund selected"}
        </Button>
        {fullPreview.ok && (
          <Button
            type="button"
            size="md"
            variant="outline"
            disabled={isPending}
            className="disabled:opacity-60"
            onClick={() => submit("FULL", fullPreview.totalCents)}
          >
            Refund everything remaining ({formatCents(fullPreview.totalCents)})
          </Button>
        )}
      </div>

      <p className="text-xs text-espresso-soft">
        Refunds go back to the customer&apos;s original card. This doesn&apos;t cancel or void a shipping label that&apos;s already been bought.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-pistachio">{success}</p>}
    </div>
  );
}
