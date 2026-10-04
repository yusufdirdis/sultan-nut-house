import { describe, expect, it } from "vitest";
import { isExpiredRateError, MAX_REQUOTE_OVERAGE_CENTS, pickRequotedRate } from "@/domain/shipping/requote";

const rates = [
  { id: "a", carrier: "UPS", serviceName: "Ground Saver", amountCents: 970 },
  { id: "b", carrier: "UPS", serviceName: "Ground", amountCents: 1041 },
  { id: "c", carrier: "USPS", serviceName: "Ground Advantage", amountCents: 1015 },
];

describe("isExpiredRateError", () => {
  it("recognises the real message Shippo returned for an expired UPS rate", () => {
    expect(
      isExpiredRateError(
        "We couldn't purchase this shipping label: Shipment Submission date (2026-10-02 04:08:49.702000+00:00) is older than 24 hs.",
      ),
    ).toBe(true);
  });

  it("does not treat other label failures as an expired rate", () => {
    expect(isExpiredRateError("We couldn't purchase this shipping label: The UPS account is not yet registered.")).toBe(false);
    expect(isExpiredRateError("Seller info missing email or phone.")).toBe(false);
  });
});

describe("pickRequotedRate", () => {
  it("finds the same carrier and service the customer chose, ignoring case", () => {
    const pick = pickRequotedRate(rates, "ups ground saver", 970);
    expect(pick).toEqual({ ok: true, rate: rates[0] });
  });

  it("reports when that service isn't offered any more", () => {
    expect(pickRequotedRate(rates, "UPS 3 Day Select®", 970)).toEqual({ ok: false, reason: "UNAVAILABLE" });
    expect(pickRequotedRate(rates, null, 970)).toEqual({ ok: false, reason: "UNAVAILABLE" });
  });

  it("allows a re-quote up to the overage limit above what the customer paid", () => {
    const atLimit = [{ ...rates[0], amountCents: 876 + MAX_REQUOTE_OVERAGE_CENTS }];
    expect(pickRequotedRate(atLimit, "UPS Ground Saver", 876)).toMatchObject({ ok: true });
  });

  it("refuses a re-quote that costs more than the limit above what the customer paid", () => {
    const over = [{ ...rates[0], amountCents: 876 + MAX_REQUOTE_OVERAGE_CENTS + 1 }];
    expect(pickRequotedRate(over, "UPS Ground Saver", 876)).toMatchObject({ ok: false, reason: "TOO_EXPENSIVE" });
  });

  it("is happy to buy when the fresh rate is cheaper", () => {
    expect(pickRequotedRate([{ ...rates[0], amountCents: 500 }], "UPS Ground Saver", 970)).toMatchObject({ ok: true });
  });
});
