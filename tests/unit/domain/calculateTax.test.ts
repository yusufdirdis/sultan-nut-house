import { describe, expect, it } from "vitest";
import { calculateTaxCents } from "@/domain/tax/calculateTax";

describe("calculateTaxCents", () => {
  it("always taxes pickup orders at the FL + Broward combined rate", () => {
    expect(calculateTaxCents({ subtotalCents: 1000, channel: "PICKUP" })).toBe(70);
  });

  it("taxes shipping orders only when the destination is FL", () => {
    expect(calculateTaxCents({ subtotalCents: 1000, channel: "SHIPPING", shippingState: "FL" })).toBe(70);
    expect(calculateTaxCents({ subtotalCents: 1000, channel: "SHIPPING", shippingState: "fl" })).toBe(70);
  });

  it("charges no tax for shipping orders outside FL (interim rule)", () => {
    expect(calculateTaxCents({ subtotalCents: 1000, channel: "SHIPPING", shippingState: "NY" })).toBe(0);
    expect(calculateTaxCents({ subtotalCents: 1000, channel: "SHIPPING" })).toBe(0);
  });
});
