/**
 * Central tax calculation — the only place a Florida rate is defined.
 *
 * Interim rule pending a full multi-state solution (Stripe Tax is the
 * planned upgrade path — see /integrations/stripe):
 *  - Pickup orders are always fulfilled in Plantation, FL, so FL + Broward
 *    County tax always applies.
 *  - Shipping orders only have clear nexus in FL today, so tax applies only
 *    when the shipping address is in FL; other states are $0 until a proper
 *    economic-nexus-aware provider is wired in. This under-collects tax
 *    that may be owed in some destination states — acceptable for launch,
 *    not a long-term compliance solution.
 */
export const FLORIDA_STATE_TAX_RATE = 0.06;
export const BROWARD_COUNTY_SURTAX_RATE = 0.01;
export const FLORIDA_COMBINED_TAX_RATE = FLORIDA_STATE_TAX_RATE + BROWARD_COUNTY_SURTAX_RATE;

export interface CalculateTaxInput {
  subtotalCents: number;
  channel: "PICKUP" | "SHIPPING";
  shippingState?: string | null;
}

export function calculateTaxCents(input: CalculateTaxInput): number {
  if (input.channel === "PICKUP") {
    return Math.round(input.subtotalCents * FLORIDA_COMBINED_TAX_RATE);
  }

  if (input.shippingState?.toUpperCase() === "FL") {
    return Math.round(input.subtotalCents * FLORIDA_COMBINED_TAX_RATE);
  }

  return 0;
}
