export interface RefundableLine {
  id: string;
  quantity: number;
  refundedQuantity: number;
  /** Unit price plus the line's modifier upcharges — what one unit actually cost. */
  unitCents: number;
}

export interface RefundOrderTotals {
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  refundedCents: number;
  shippingRefunded: boolean;
}

export interface RefundSelection {
  lines: { id: string; quantity: number }[];
  includeShipping: boolean;
}

export type RefundComputation =
  | {
      ok: true;
      itemsCents: number;
      taxCents: number;
      shippingCents: number;
      totalCents: number;
    }
  | { ok: false; error: string };

/**
 * Works out how much to send back for a set of order lines (plus optionally
 * shipping). Tax is refunded in proportion to the items being refunded, since
 * tax is only ever charged on the subtotal (see domain/tax/calculateTax).
 *
 * Per-line tax shares are rounded, so several partial refunds can drift from
 * the real tax by a cent or two. The refund that finishes off the order
 * (every unit and shipping refunded) therefore pays out exactly what's left,
 * so the customer always ends up refunded the precise amount they paid.
 */
export function computeRefund(
  order: RefundOrderTotals,
  lines: RefundableLine[],
  selection: RefundSelection,
): RefundComputation {
  const remainingCents = Math.max(0, order.totalCents - order.refundedCents);
  if (remainingCents === 0) return { ok: false, error: "This order has already been fully refunded." };

  const requested = new Map<string, number>();
  for (const { id, quantity } of selection.lines) {
    if (!Number.isInteger(quantity) || quantity < 0) return { ok: false, error: "Invalid quantity." };
    if (quantity > 0) requested.set(id, (requested.get(id) ?? 0) + quantity);
  }

  const lineById = new Map(lines.map((line) => [line.id, line]));
  let itemsCents = 0;

  for (const [id, quantity] of requested) {
    const line = lineById.get(id);
    if (!line) return { ok: false, error: "One of the selected items isn't on this order." };

    const refundable = line.quantity - line.refundedQuantity;
    if (quantity > refundable) {
      return {
        ok: false,
        error: refundable === 0 ? "One of the selected items was already refunded." : `Only ${refundable} left to refund on one of the selected items.`,
      };
    }
    itemsCents += line.unitCents * quantity;
  }

  if (selection.includeShipping && order.shippingRefunded) {
    return { ok: false, error: "Shipping was already refunded on this order." };
  }
  const shippingCents = selection.includeShipping ? order.shippingCents : 0;

  if (itemsCents === 0 && shippingCents === 0) {
    return { ok: false, error: "Select at least one item (or shipping) to refund." };
  }

  const itemTaxCents = order.subtotalCents > 0 ? Math.round((order.taxCents * itemsCents) / order.subtotalCents) : 0;

  const everyUnitRefunded = lines.every((line) => line.refundedQuantity + (requested.get(line.id) ?? 0) >= line.quantity);
  const shippingSettled = order.shippingRefunded || selection.includeShipping || order.shippingCents === 0;

  if (everyUnitRefunded && shippingSettled) {
    return {
      ok: true,
      itemsCents,
      shippingCents,
      taxCents: Math.max(0, remainingCents - itemsCents - shippingCents),
      totalCents: remainingCents,
    };
  }

  const totalCents = Math.min(itemsCents + itemTaxCents + shippingCents, remainingCents);
  return { ok: true, itemsCents, shippingCents, taxCents: totalCents - itemsCents - shippingCents, totalCents };
}

/** Everything still refundable on the order: all remaining units, plus shipping if it hasn't been refunded. */
export function fullRefundSelection(lines: RefundableLine[], shippingRefunded: boolean): RefundSelection {
  return {
    lines: lines
      .filter((line) => line.quantity - line.refundedQuantity > 0)
      .map((line) => ({ id: line.id, quantity: line.quantity - line.refundedQuantity })),
    includeShipping: !shippingRefunded,
  };
}
