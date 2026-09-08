export interface ModifierSelectionInput {
  priceDeltaCents: number;
}

export interface LineItemInput {
  unitPriceCents: number;
  quantity: number;
  modifiers: ModifierSelectionInput[];
}

/**
 * Line item total = (variant price + sum of selected modifier price deltas) x
 * quantity. This is computed once at add-to-cart time and snapshotted onto
 * CartItem/CartItemModifier (and later OrderItem/OrderItemModifier) so a
 * later catalog price change never silently changes what a customer already
 * agreed to pay.
 */
export function calculateLineItemTotalCents(input: LineItemInput): number {
  if (input.quantity < 1) {
    throw new RangeError("quantity must be at least 1");
  }

  const modifierTotalCents = input.modifiers.reduce((sum, modifier) => sum + modifier.priceDeltaCents, 0);
  const unitTotalCents = input.unitPriceCents + modifierTotalCents;

  return unitTotalCents * input.quantity;
}

export function calculateCartSubtotalCents(lineItems: LineItemInput[]): number {
  return lineItems.reduce((sum, item) => sum + calculateLineItemTotalCents(item), 0);
}
