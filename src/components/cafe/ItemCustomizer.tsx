"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { addToCart } from "@/server/actions/cart-actions";
import { formatCents } from "@/lib/money";

interface ModifierOption {
  id: string;
  name: string;
  priceDeltaCents: number;
  isDefault: boolean;
  isAvailable: boolean;
}

interface ModifierGroup {
  id: string;
  name: string;
  selectionType: "SINGLE" | "MULTI";
  minSelect: number;
  maxSelect: number;
  required: boolean;
  options: ModifierOption[];
}

interface Variant {
  id: string;
  name: string;
  priceCents: number;
  isAvailable: boolean;
}

export function ItemCustomizer({ variants, modifierGroups }: { variants: Variant[]; modifierGroups: ModifierGroup[] }) {
  const router = useRouter();
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [selections, setSelections] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      modifierGroups.map((group) => [group.id, group.options.filter((o) => o.isDefault).map((o) => o.id)]),
    ),
  );
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedVariant = variants.find((v) => v.id === variantId);

  function toggleOption(group: ModifierGroup, optionId: string) {
    setSelections((current) => {
      const existing = current[group.id] ?? [];

      if (group.selectionType === "SINGLE") {
        return { ...current, [group.id]: [optionId] };
      }

      if (existing.includes(optionId)) {
        return { ...current, [group.id]: existing.filter((id) => id !== optionId) };
      }

      if (existing.length >= group.maxSelect) return current;
      return { ...current, [group.id]: [...existing, optionId] };
    });
  }

  const modifierTotalCents = useMemo(() => {
    return modifierGroups.reduce((sum, group) => {
      const selectedIds = selections[group.id] ?? [];
      const groupTotal = group.options
        .filter((option) => selectedIds.includes(option.id))
        .reduce((s, option) => s + option.priceDeltaCents, 0);
      return sum + groupTotal;
    }, 0);
  }, [modifierGroups, selections]);

  const unmetRequiredGroup = modifierGroups.find(
    (group) => group.required && (selections[group.id]?.length ?? 0) < Math.max(1, group.minSelect),
  );

  const totalCents = ((selectedVariant?.priceCents ?? 0) + modifierTotalCents) * quantity;

  async function handleAddToCart() {
    if (!selectedVariant || unmetRequiredGroup) return;
    setIsSubmitting(true);
    setMessage(null);

    const result = await addToCart({
      channel: "PICKUP",
      productVariantId: selectedVariant.id,
      quantity,
      notes: notes || undefined,
      modifierOptionIds: Object.values(selections).flat(),
    });

    setIsSubmitting(false);

    if (!result.success) {
      setMessage({ type: "error", text: result.message ?? "Something went wrong." });
      return;
    }

    setMessage({ type: "success", text: "Added to your pickup order." });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      {variants.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-espresso" htmlFor="item-variant">
            Options
          </label>
          <select
            id="item-variant"
            value={variantId}
            onChange={(event) => setVariantId(event.target.value)}
            className="h-12 rounded-xl border border-espresso/20 bg-white px-4 text-base text-espresso outline-none focus:border-brass"
          >
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id} disabled={!variant.isAvailable}>
                {variant.name} — {formatCents(variant.priceCents)}
              </option>
            ))}
          </select>
        </div>
      )}

      {modifierGroups.map((group) => {
        const selectedIds = selections[group.id] ?? [];
        return (
          <fieldset key={group.id}>
            <legend className="flex items-baseline justify-between text-sm font-medium text-espresso">
              <span>
                {group.name}
                {group.required && <span className="ml-1 text-brass">*</span>}
              </span>
              <span className="text-xs font-normal text-espresso-soft">
                {group.selectionType === "MULTI" ? `Choose up to ${group.maxSelect}` : "Choose 1"}
              </span>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.options
                .filter((option) => option.isAvailable)
                .map((option) => {
                  const checked = selectedIds.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleOption(group, option.id)}
                      aria-pressed={checked}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                        checked ? "border-brass bg-brass/10 text-espresso" : "border-line text-espresso-soft hover:border-espresso/40"
                      }`}
                    >
                      {option.name}
                      {option.priceDeltaCents > 0 && ` +${formatCents(option.priceDeltaCents)}`}
                    </button>
                  );
                })}
            </div>
          </fieldset>
        );
      })}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-espresso" htmlFor="item-notes">
          Special instructions (optional)
        </label>
        <textarea
          id="item-notes"
          rows={2}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="e.g. no ice, extra napkins"
          className="rounded-xl border border-espresso/20 bg-white px-4 py-3 text-base text-espresso outline-none focus:border-brass"
        />
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-espresso">Quantity</span>
        <div className="flex items-center rounded-full border border-espresso/20">
          <button
            type="button"
            aria-label="Decrease quantity"
            className="flex h-11 w-11 items-center justify-center text-lg text-espresso"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="w-8 text-center text-base text-espresso">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            className="flex h-11 w-11 items-center justify-center text-lg text-espresso"
            onClick={() => setQuantity((q) => Math.min(50, q + 1))}
          >
            +
          </button>
        </div>
      </div>

      {message && <p className={message.type === "error" ? "text-sm text-red-600" : "text-sm text-pistachio"}>{message.text}</p>}

      <Button
        type="button"
        variant="brass"
        size="lg"
        onClick={handleAddToCart}
        disabled={isSubmitting || !selectedVariant || Boolean(unmetRequiredGroup)}
        className="disabled:opacity-60"
      >
        {isSubmitting ? "Adding…" : `Add to order — ${formatCents(totalCents)}`}
      </Button>
    </div>
  );
}
