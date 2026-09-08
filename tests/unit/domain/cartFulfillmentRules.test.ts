import { describe, expect, it } from "vitest";
import { assertProductAllowedInCart } from "@/domain/cart/cartFulfillmentRules";

describe("assertProductAllowedInCart", () => {
  it("allows a PICKUP_ONLY product in a PICKUP cart", () => {
    expect(() => assertProductAllowedInCart("PICKUP_ONLY", "PICKUP")).not.toThrow();
  });

  it("never allows a PICKUP_ONLY product (e.g. a latte) into a SHIPPING cart", () => {
    expect(() => assertProductAllowedInCart("PICKUP_ONLY", "SHIPPING")).toThrow(/only available for pickup/i);
  });

  it("never allows a SHIPPING_ONLY product into a PICKUP cart", () => {
    expect(() => assertProductAllowedInCart("SHIPPING_ONLY", "PICKUP")).toThrow(/only available for shipping/i);
  });

  it("allows a SHIPPING_ONLY product in a SHIPPING cart", () => {
    expect(() => assertProductAllowedInCart("SHIPPING_ONLY", "SHIPPING")).not.toThrow();
  });

  it("allows a BOTH product into either cart channel", () => {
    expect(() => assertProductAllowedInCart("BOTH", "PICKUP")).not.toThrow();
    expect(() => assertProductAllowedInCart("BOTH", "SHIPPING")).not.toThrow();
  });
});
