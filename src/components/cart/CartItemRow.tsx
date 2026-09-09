"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { formatCents } from "@/lib/money";
import { removeCartItem, updateCartItemQuantity } from "@/server/actions/cart-actions";
import type { FulfillmentChannel } from "@/generated/prisma/enums";

export interface CartItemRowData {
  id: string;
  quantity: number;
  unitPriceCentsSnapshot: number;
  notes: string | null;
  productName: string;
  variantName: string;
  imageUrl?: string | null;
  modifiers: { name: string; priceDeltaCentsSnapshot: number }[];
}

export function CartItemRow({ channel, item }: { channel: FulfillmentChannel; item: CartItemRowData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const modifierTotal = item.modifiers.reduce((sum, m) => sum + m.priceDeltaCentsSnapshot, 0);
  const lineTotal = (item.unitPriceCentsSnapshot + modifierTotal) * item.quantity;

  function changeQuantity(nextQuantity: number) {
    startTransition(async () => {
      await updateCartItemQuantity(channel, item.id, nextQuantity);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await removeCartItem(channel, item.id);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-4 border-b border-line py-5">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-espresso">{item.productName}</p>
            <p className="text-sm text-espresso-soft">{item.variantName}</p>
            {item.modifiers.length > 0 && (
              <p className="mt-0.5 text-xs text-espresso-soft">{item.modifiers.map((m) => m.name).join(", ")}</p>
            )}
            {item.notes && <p className="mt-0.5 text-xs italic text-espresso-soft">&ldquo;{item.notes}&rdquo;</p>}
          </div>
          <p className="font-medium text-espresso">{formatCents(lineTotal)}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center rounded-full border border-espresso/20">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={isPending}
              className="flex h-8 w-8 items-center justify-center text-espresso disabled:opacity-50"
              onClick={() => changeQuantity(item.quantity - 1)}
            >
              −
            </button>
            <span className="w-6 text-center text-sm text-espresso">{item.quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={isPending}
              className="flex h-8 w-8 items-center justify-center text-espresso disabled:opacity-50"
              onClick={() => changeQuantity(item.quantity + 1)}
            >
              +
            </button>
          </div>
          <button type="button" disabled={isPending} onClick={remove} className="text-sm font-medium text-red-600 disabled:opacity-50">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
