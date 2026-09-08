import { describe, expect, it } from "vitest";
import { calculateCartSubtotalCents, calculateLineItemTotalCents } from "@/domain/pricing/calculateLineItemTotal";

describe("calculateLineItemTotalCents", () => {
  it("multiplies unit price by quantity when there are no modifiers", () => {
    expect(calculateLineItemTotalCents({ unitPriceCents: 595, quantity: 2, modifiers: [] })).toBe(1190);
  });

  it("adds modifier price deltas before multiplying by quantity (matches the Iced Matcha Latte example)", () => {
    // Large (+150) + Oat Milk (+75) + Extra Matcha (+100), qty 2
    const total = calculateLineItemTotalCents({
      unitPriceCents: 595,
      quantity: 2,
      modifiers: [{ priceDeltaCents: 150 }, { priceDeltaCents: 75 }, { priceDeltaCents: 100 }],
    });
    expect(total).toBe((595 + 150 + 75 + 100) * 2);
  });

  it("rejects a quantity below 1", () => {
    expect(() => calculateLineItemTotalCents({ unitPriceCents: 500, quantity: 0, modifiers: [] })).toThrow(RangeError);
  });
});

describe("calculateCartSubtotalCents", () => {
  it("sums multiple line items", () => {
    const subtotal = calculateCartSubtotalCents([
      { unitPriceCents: 595, quantity: 1, modifiers: [] },
      { unitPriceCents: 450, quantity: 2, modifiers: [{ priceDeltaCents: 0 }] },
    ]);
    expect(subtotal).toBe(595 + 450 * 2);
  });
});
