"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { addToCart } from "@/server/actions/cart-actions";
import { formatCents } from "@/lib/money";

interface Variant {
  id: string;
  name: string;
  priceCents: number;
  isAvailable: boolean;
}

export function AddToCartForm({ variants }: { variants: Variant[] }) {
  const router = useRouter();
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedVariant = variants.find((v) => v.id === variantId);

  async function handleAddToCart() {
    if (!selectedVariant) return;
    setIsSubmitting(true);
    setMessage(null);

    const result = await addToCart({
      channel: "SHIPPING",
      productVariantId: selectedVariant.id,
      quantity,
      modifierOptionIds: [],
    });

    setIsSubmitting(false);

    if (!result.success) {
      setMessage({ type: "error", text: result.message ?? "Something went wrong." });
      return;
    }

    setMessage({ type: "success", text: "Added to cart." });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {variants.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-espresso" htmlFor="variant">
            Options
          </label>
          <select
            id="variant"
            value={variantId}
            onChange={(event) => setVariantId(event.target.value)}
            className="h-12 rounded-xl border border-espresso/20 bg-white px-4 text-base text-espresso outline-none focus:border-brass"
          >
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id} disabled={!variant.isAvailable}>
                {variant.name} — {formatCents(variant.priceCents)}
                {!variant.isAvailable && " (Out of stock)"}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-espresso" htmlFor="quantity">
          Quantity
        </label>
        <div className="flex items-center rounded-full border border-espresso/20">
          <button
            type="button"
            aria-label="Decrease quantity"
            className="flex h-11 w-11 items-center justify-center text-lg text-espresso"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span id="quantity" className="w-8 text-center text-base text-espresso">
            {quantity}
          </span>
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
        disabled={isSubmitting || !selectedVariant?.isAvailable}
        className="disabled:opacity-60"
      >
        {isSubmitting ? "Adding…" : selectedVariant?.isAvailable === false ? "Out of stock" : "Add to cart"}
      </Button>
    </div>
  );
}
