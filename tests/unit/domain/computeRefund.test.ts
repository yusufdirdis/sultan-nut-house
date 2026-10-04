import { describe, expect, it } from "vitest";
import { computeRefund, fullRefundSelection, type RefundableLine, type RefundOrderTotals } from "@/domain/orders/computeRefund";

function order(overrides: Partial<RefundOrderTotals> = {}): RefundOrderTotals {
  return { subtotalCents: 1699, taxCents: 0, shippingCents: 876, totalCents: 2575, refundedCents: 0, shippingRefunded: false, ...overrides };
}

function line(id: string, quantity: number, unitCents: number, refundedQuantity = 0): RefundableLine {
  return { id, quantity, unitCents, refundedQuantity };
}

describe("computeRefund", () => {
  it("refunds just an item, leaving shipping with the business", () => {
    const result = computeRefund(order(), [line("a", 1, 1699)], { lines: [{ id: "a", quantity: 1 }], includeShipping: false });
    expect(result).toEqual({ ok: true, itemsCents: 1699, shippingCents: 0, taxCents: 0, totalCents: 1699 });
  });

  it("refunds exactly the full amount paid when every item and shipping are selected", () => {
    const result = computeRefund(order(), [line("a", 1, 1699)], { lines: [{ id: "a", quantity: 1 }], includeShipping: true });
    expect(result).toMatchObject({ ok: true, totalCents: 2575, shippingCents: 876 });
  });

  it("refunds tax in proportion to the items being refunded", () => {
    const o = order({ subtotalCents: 2000, taxCents: 140, shippingCents: 500, totalCents: 2640 });
    const lines = [line("a", 1, 1000), line("b", 1, 1000)];
    const result = computeRefund(o, lines, { lines: [{ id: "a", quantity: 1 }], includeShipping: false });
    expect(result).toEqual({ ok: true, itemsCents: 1000, shippingCents: 0, taxCents: 70, totalCents: 1070 });
  });

  it("handles refunding some units of a line and then the rest", () => {
    const o = order({ subtotalCents: 1500, taxCents: 105, shippingCents: 0, totalCents: 1605 });
    const first = computeRefund(o, [line("a", 3, 500)], { lines: [{ id: "a", quantity: 1 }], includeShipping: false });
    expect(first).toMatchObject({ ok: true, itemsCents: 500, taxCents: 35, totalCents: 535 });

    const second = computeRefund(
      { ...o, refundedCents: 535 },
      [line("a", 3, 500, 1)],
      { lines: [{ id: "a", quantity: 2 }], includeShipping: false },
    );
    expect(second).toMatchObject({ ok: true, itemsCents: 1000, totalCents: 1070 });
  });

  it("absorbs per-line rounding so the last refund lands exactly on what the customer paid", () => {
    const o = order({ subtotalCents: 999, taxCents: 70, shippingCents: 0, totalCents: 1069 });
    const lines = (done: number[]) => [line("a", 1, 333, done[0]), line("b", 1, 333, done[1]), line("c", 1, 333, done[2])];

    const a = computeRefund(o, lines([0, 0, 0]), { lines: [{ id: "a", quantity: 1 }], includeShipping: false });
    const b = computeRefund({ ...o, refundedCents: 356 }, lines([1, 0, 0]), { lines: [{ id: "b", quantity: 1 }], includeShipping: false });
    const c = computeRefund({ ...o, refundedCents: 712 }, lines([1, 1, 0]), { lines: [{ id: "c", quantity: 1 }], includeShipping: false });

    expect([a, b, c].map((r) => (r.ok ? r.totalCents : -1))).toEqual([356, 356, 357]);
  });

  it("rejects refunding more units than are left", () => {
    const result = computeRefund(order(), [line("a", 2, 800, 1)], { lines: [{ id: "a", quantity: 2 }], includeShipping: false });
    expect(result).toEqual({ ok: false, error: "Only 1 left to refund on one of the selected items." });
  });

  it("rejects an item that was already fully refunded", () => {
    const result = computeRefund(order({ refundedCents: 1699 }), [line("a", 1, 1699, 1)], { lines: [{ id: "a", quantity: 1 }], includeShipping: false });
    expect(result).toEqual({ ok: false, error: "One of the selected items was already refunded." });
  });

  it("rejects refunding shipping twice", () => {
    const result = computeRefund(order({ shippingRefunded: true, refundedCents: 876 }), [line("a", 1, 1699)], {
      lines: [],
      includeShipping: true,
    });
    expect(result).toEqual({ ok: false, error: "Shipping was already refunded on this order." });
  });

  it("rejects an empty selection", () => {
    const result = computeRefund(order(), [line("a", 1, 1699)], { lines: [], includeShipping: false });
    expect(result).toMatchObject({ ok: false });
  });

  it("rejects anything on an order that's already fully refunded", () => {
    const result = computeRefund(order({ refundedCents: 2575 }), [line("a", 1, 1699, 1)], { lines: [], includeShipping: true });
    expect(result).toEqual({ ok: false, error: "This order has already been fully refunded." });
  });

  it("never refunds more than what's left, e.g. after a partial refund made in Stripe's dashboard", () => {
    const result = computeRefund(order({ refundedCents: 2000 }), [line("a", 1, 1699)], { lines: [{ id: "a", quantity: 1 }], includeShipping: true });
    expect(result).toMatchObject({ ok: true, totalCents: 575 });
  });
});

describe("fullRefundSelection", () => {
  it("selects every remaining unit and shipping when it hasn't been refunded", () => {
    expect(fullRefundSelection([line("a", 3, 500, 1), line("b", 1, 100, 1)], false)).toEqual({
      lines: [{ id: "a", quantity: 2 }],
      includeShipping: true,
    });
  });

  it("leaves shipping out once it's already been refunded", () => {
    expect(fullRefundSelection([line("a", 1, 500)], true).includeShipping).toBe(false);
  });
});
