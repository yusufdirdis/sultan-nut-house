"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { AppError, toSafeError } from "@/lib/errors";
import { getShippingProvider, type ShippingLabel } from "@/integrations/shipping";
import { emailProvider } from "@/integrations/email";
import { formatCents } from "@/lib/money";
import { isExpiredRateError, pickRequotedRate } from "@/domain/shipping/requote";
import type { ActionResult } from "@/server/actions/auth-actions";
import type { OrderStatus } from "@/generated/prisma/enums";

export async function listShippingOrders() {
  await requireAdmin();
  return db.order.findMany({
    where: { fulfillmentType: "SHIPPING", status: { in: ["PAID", "PROCESSING", "PACKING", "SHIPPED", "DELIVERED", "REFUNDED"] } },
    include: { items: true, shippingAddress: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function listPickupOrders() {
  await requireAdmin();
  return db.order.findMany({
    where: { fulfillmentType: "PICKUP", status: { in: ["PAID", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "COMPLETED", "REFUNDED"] } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function buyShippingLabel(orderId: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { shippingAddress: true, items: { include: { productVariant: true } } },
    });
    if (!order || !order.shippingAddress) {
      throw new AppError("This order doesn't have a shipping address on file.", "ORDER_MISSING_ADDRESS");
    }
    if (!order.shippoRateId) {
      throw new AppError(
        "No live carrier rate was recorded for this order — enter tracking manually once you've shipped it.",
        "NO_RATE_ON_ORDER",
      );
    }
    if (order.labelUrl) {
      throw new AppError("A label has already been purchased for this order.", "LABEL_ALREADY_PURCHASED");
    }

    const carrier = order.shippingServiceName?.split(" ")[0] ?? "Carrier";

    const provider = getShippingProvider();
    const toAddress = {
      recipientName: order.shippingAddress.recipientName,
      line1: order.shippingAddress.line1,
      line2: order.shippingAddress.line2 ?? undefined,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      postalCode: order.shippingAddress.postalCode,
      country: order.shippingAddress.country,
      phone: order.shippingAddress.phone ?? undefined,
    };

    let label: ShippingLabel;
    let rateId = order.shippoRateId;
    let requotedCents: number | null = null;

    try {
      label = await provider.createLabel({ rateId, carrier, toAddress });
    } catch (error) {
      // The rate saved at checkout expires after ~24h (carrier-enforced), so any
      // order not labeled the same day lands here. Quote the same service
      // again for the same parcel and buy that instead — but only if it isn't
      // meaningfully dearer than what the customer paid for shipping.
      if (!(error instanceof AppError) || !isExpiredRateError(error.message)) throw error;

      const freshRates = await provider.getRates({
        toAddress,
        items: order.items.map((item) => ({ weightGrams: item.productVariant.weightGrams ?? 200, quantity: item.quantity })),
      });
      const pick = pickRequotedRate(freshRates, order.shippingServiceName, order.shippingCents);

      if (!pick.ok && pick.reason === "UNAVAILABLE") {
        throw new AppError(
          `The shipping rate saved with this order has expired, and ${order.shippingServiceName ?? "the customer's shipping option"} isn't available for a fresh quote right now. Nothing was bought — try again later, or buy the label in Shippo and use "Enter tracking".`,
          "REQUOTE_UNAVAILABLE",
        );
      }
      if (!pick.ok) {
        throw new AppError(
          `The shipping rate saved with this order has expired, and today's ${order.shippingServiceName} price (${formatCents(pick.rate.amountCents)}) is well above the ${formatCents(order.shippingCents)} the customer paid. Nothing was bought — buy it in Shippo yourself if you're happy with that price, then use "Enter tracking".`,
          "REQUOTE_TOO_EXPENSIVE",
        );
      }

      rateId = pick.rate.id;
      requotedCents = pick.rate.amountCents;
      label = await provider.createLabel({ rateId, carrier, toAddress });
    }

    await db.order.update({
      where: { id: order.id },
      data: {
        shippoRateId: rateId,
        trackingNumber: label.trackingNumber,
        trackingCarrier: label.carrier,
        trackingUrl: label.trackingUrl,
        labelUrl: label.labelUrl,
        status: "SHIPPED",
      },
    });

    await emailProvider
      .send({
        to: order.contactEmail,
        subject: `Your order ${order.orderNumber} has shipped`,
        text: `Your order is on its way! Tracking: ${label.trackingUrl ?? label.trackingNumber}`,
        html: `<p>Your order is on its way!</p><p>Tracking number: ${label.trackingNumber}</p>${
          label.trackingUrl ? `<p><a href="${label.trackingUrl}">Track your package</a></p>` : ""
        }`,
      })
      .catch((error) => console.error("[admin-orders] failed to send shipped email", error));

    revalidatePath("/admin/orders/shipping");
    return {
      success: true,
      message:
        requotedCents === null
          ? "Label purchased and order marked shipped."
          : `Label purchased and order marked shipped. The original rate had expired, so a fresh ${order.shippingServiceName} rate was used: ${formatCents(requotedCents)} (customer paid ${formatCents(order.shippingCents)} for shipping).`,
    };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't purchase this label.");
    return { success: false, message: safeError.userMessage };
  }
}

export async function setTrackingManually(orderId: string, trackingNumber: string, carrier: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    await db.order.update({
      where: { id: orderId },
      data: { trackingNumber, trackingCarrier: carrier, status: "SHIPPED" },
    });

    revalidatePath("/admin/orders/shipping");
    return { success: true, message: "Tracking saved and order marked shipped." };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't save tracking for this order.");
    return { success: false, message: safeError.userMessage };
  }
}

const PICKUP_STATUS_FLOW: string[] = ["PAID", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "COMPLETED"];
const SHIPPING_STATUS_FLOW: string[] = ["PAID", "PROCESSING", "PACKING", "SHIPPED", "DELIVERED"];

export async function advanceOrderStatus(orderId: string, channel: "PICKUP" | "SHIPPING"): Promise<ActionResult> {
  try {
    await requireAdmin();

    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError("Order not found.", "ORDER_NOT_FOUND");

    const flow = channel === "PICKUP" ? PICKUP_STATUS_FLOW : SHIPPING_STATUS_FLOW;
    const currentIndex = flow.indexOf(order.status);
    const nextStatus = currentIndex >= 0 && currentIndex < flow.length - 1 ? flow[currentIndex + 1] : null;

    if (!nextStatus) {
      throw new AppError("This order is already at its final status.", "NO_NEXT_STATUS");
    }

    await db.order.update({ where: { id: orderId }, data: { status: nextStatus as OrderStatus } });
    revalidatePath(channel === "PICKUP" ? "/admin/orders/pickup" : "/admin/orders/shipping");
    return { success: true, message: `Order marked ${nextStatus.replace(/_/g, " ").toLowerCase()}.` };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't update this order.");
    return { success: false, message: safeError.userMessage };
  }
}
