"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { AppError, toSafeError } from "@/lib/errors";
import { formatCents } from "@/lib/money";
import { stripe } from "@/integrations/stripe/client";
import { emailProvider } from "@/integrations/email";
import { computeRefund, fullRefundSelection, type RefundableLine } from "@/domain/orders/computeRefund";
import type { ActionResult } from "@/server/actions/auth-actions";

const NON_REFUNDABLE_STATUSES = ["PENDING_PAYMENT", "CANCELLED", "REFUNDED"];

export async function getAdminOrder(id: string) {
  await requireAdmin();

  return db.order.findUnique({
    where: { id },
    include: {
      items: { include: { modifiers: true }, orderBy: { id: "asc" } },
      shippingAddress: true,
      refunds: { orderBy: { createdAt: "desc" } },
    },
  });
}

const refundInputSchema = z.object({
  orderId: z.string().min(1),
  mode: z.enum(["FULL", "ITEMS"]),
  lines: z.array(z.object({ orderItemId: z.string().min(1), quantity: z.number().int().min(0) })).default([]),
  includeShipping: z.boolean().default(false),
  reason: z.enum(["requested_by_customer", "duplicate", "fraudulent"]).default("requested_by_customer"),
  note: z.string().trim().max(500).optional(),
});

export type RefundOrderInput = z.input<typeof refundInputSchema>;

export async function refundOrder(input: RefundOrderInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = refundInputSchema.parse(input);

    const order = await db.order.findUnique({
      where: { id: parsed.orderId },
      include: { items: { include: { modifiers: true } }, refunds: true },
    });
    if (!order) throw new AppError("Order not found.", "ORDER_NOT_FOUND");

    if (!order.stripePaymentIntentId) {
      throw new AppError(
        "This order has no card payment on file to refund from here — refund it directly in the Stripe dashboard.",
        "NO_PAYMENT_INTENT",
      );
    }
    if (NON_REFUNDABLE_STATUSES.includes(order.status)) {
      throw new AppError("This order isn't in a state that can be refunded.", "ORDER_NOT_REFUNDABLE");
    }

    const lines: RefundableLine[] = order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      refundedQuantity: item.refundedQuantity,
      unitCents: item.unitPriceCentsSnapshot + item.modifiers.reduce((sum, m) => sum + m.priceDeltaCentsSnapshot, 0),
    }));
    const shippingRefunded = order.refunds.some((refund) => refund.shippingCents > 0);

    const selection =
      parsed.mode === "FULL"
        ? fullRefundSelection(lines, shippingRefunded)
        : { lines: parsed.lines.map((l) => ({ id: l.orderItemId, quantity: l.quantity })), includeShipping: parsed.includeShipping };

    const computation = computeRefund(
      {
        subtotalCents: order.subtotalCents,
        taxCents: order.taxCents,
        shippingCents: order.shippingCents,
        totalCents: order.totalCents,
        refundedCents: order.refundedCents,
        shippingRefunded,
      },
      lines,
      selection,
    );
    if (!computation.ok) throw new AppError(computation.error, "INVALID_REFUND");

    const selectionKey = selection.lines
      .map((l) => `${l.id}:${l.quantity}`)
      .sort()
      .join(",");
    const idempotencyKey = `refund:${order.id}:${order.refundedCents}:${computation.totalCents}:${createHash("sha1")
      .update(`${selectionKey}|${selection.includeShipping}`)
      .digest("hex")}`;

    let stripeRefund: Stripe.Refund;
    try {
      stripeRefund = await stripe.refunds.create(
        {
          payment_intent: order.stripePaymentIntentId,
          amount: computation.totalCents,
          reason: parsed.reason,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            refundedBy: admin.id,
            ...(parsed.note ? { note: parsed.note } : {}),
          },
        },
        { idempotencyKey },
      );
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        console.error("[admin-refund] stripe refund failed", error);
        throw new AppError(`Stripe couldn't process this refund: ${error.message}`, "STRIPE_REFUND_FAILED", error);
      }
      throw error;
    }

    // Double-click / retry: Stripe hands back the same refund for the same
    // idempotency key, so recording it twice would trip the unique index.
    const alreadyRecorded = await db.refund.findUnique({ where: { stripeRefundId: stripeRefund.id } });
    if (alreadyRecorded) {
      return { success: true, message: `Refunded ${formatCents(alreadyRecorded.amountCents)}.` };
    }

    // Ask Stripe for the charge's running refunded total instead of adding to
    // our own copy — the charge.refunded webhook writes the same number, so
    // whichever lands first, they agree.
    const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId, { expand: ["latest_charge"] });
    const charge = typeof intent.latest_charge === "object" && intent.latest_charge ? intent.latest_charge : null;
    const refundedTotalCents = charge?.amount_refunded ?? order.refundedCents + computation.totalCents;
    const fullyRefunded = refundedTotalCents >= order.totalCents;

    const refundedLines = selection.lines.map((l) => {
      const item = order.items.find((i) => i.id === l.id);
      return { orderItemId: l.id, name: item ? `${item.productNameSnapshot} (${item.variantNameSnapshot})` : "Item", quantity: l.quantity };
    });

    await db.$transaction(async (tx) => {
      await tx.refund.create({
        data: {
          orderId: order.id,
          stripeRefundId: stripeRefund.id,
          amountCents: computation.totalCents,
          shippingCents: computation.shippingCents,
          taxCents: computation.taxCents,
          reason: parsed.reason,
          note: parsed.note || null,
          lines: refundedLines,
          actorUserId: admin.id,
        },
      });

      for (const line of selection.lines) {
        await tx.orderItem.update({ where: { id: line.id }, data: { refundedQuantity: { increment: line.quantity } } });
      }

      await tx.order.update({
        where: { id: order.id },
        data: { refundedCents: refundedTotalCents, ...(fullyRefunded ? { status: "REFUNDED" } : {}) },
      });

      await tx.payment.updateMany({
        where: { orderId: order.id, stripePaymentIntentId: order.stripePaymentIntentId },
        data: { status: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED" },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: "ORDER_REFUNDED",
          entityType: "Order",
          entityId: order.id,
          afterJson: {
            amountCents: computation.totalCents,
            stripeRefundId: stripeRefund.id,
            reason: parsed.reason,
            lines: refundedLines,
            includedShipping: computation.shippingCents > 0,
          },
        },
      });
    });

    const itemSummary = refundedLines.map((l) => `${l.quantity}x ${l.name}`).join("\n");
    await emailProvider
      .send({
        to: order.contactEmail,
        subject: `Your refund for order ${order.orderNumber}`,
        text: `We've refunded ${formatCents(computation.totalCents)} to your original payment method for order ${order.orderNumber}.${
          itemSummary ? `\n\nRefunded items:\n${itemSummary}` : ""
        }\n\nIt can take 5–10 business days to show up on your statement.`,
        html: `<p>We've refunded <strong>${formatCents(computation.totalCents)}</strong> to your original payment method for order ${order.orderNumber}.</p>${
          itemSummary ? `<p>Refunded items:</p><pre>${itemSummary}</pre>` : ""
        }<p>It can take 5–10 business days to show up on your statement.</p>`,
      })
      .catch((error) => console.error("[admin-refund] failed to send refund email", error));

    revalidatePath(`/admin/orders/${order.id}`);
    revalidatePath("/admin/orders/shipping");
    revalidatePath("/admin/orders/pickup");

    return {
      success: true,
      message: fullyRefunded
        ? `Refunded ${formatCents(computation.totalCents)} — the order is now fully refunded.`
        : `Refunded ${formatCents(computation.totalCents)}.`,
    };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't process this refund.");
    return { success: false, message: safeError.userMessage };
  }
}
