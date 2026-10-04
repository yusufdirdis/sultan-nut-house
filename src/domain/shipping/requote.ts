/**
 * A carrier rate is only good for a short window after it's quoted (UPS: 24
 * hours), but the rate saved on an order is the one quoted at checkout — so
 * any order not labeled the same day fails to buy. These helpers decide what
 * to do then: quote the same service again, and only buy it if it isn't
 * meaningfully more than the customer paid for shipping.
 */

/** How far above the customer's shipping charge a re-quoted label may cost before we stop and ask. */
export const MAX_REQUOTE_OVERAGE_CENTS = 300;

/** True for the carrier/Shippo errors that mean "this saved rate has expired". */
export function isExpiredRateError(message: string): boolean {
  return /older than 24|expired|no longer valid/i.test(message);
}

interface QuotedRate {
  carrier: string;
  serviceName: string;
  amountCents: number;
}

export type RequotePick<T extends QuotedRate> =
  | { ok: true; rate: T }
  | { ok: false; reason: "UNAVAILABLE" }
  | { ok: false; reason: "TOO_EXPENSIVE"; rate: T };

/**
 * Finds the same carrier + service the customer chose (stored on the order as
 * "UPS Ground Saver") among fresh rates, and checks its price against what
 * they paid for shipping.
 */
export function pickRequotedRate<T extends QuotedRate>(
  freshRates: T[],
  chosenService: string | null,
  paidShippingCents: number,
): RequotePick<T> {
  const wanted = chosenService?.trim().toLowerCase();
  const rate = wanted ? freshRates.find((r) => `${r.carrier} ${r.serviceName}`.trim().toLowerCase() === wanted) : undefined;

  if (!rate) return { ok: false, reason: "UNAVAILABLE" };
  if (rate.amountCents > paidShippingCents + MAX_REQUOTE_OVERAGE_CENTS) return { ok: false, reason: "TOO_EXPENSIVE", rate };
  return { ok: true, rate };
}
