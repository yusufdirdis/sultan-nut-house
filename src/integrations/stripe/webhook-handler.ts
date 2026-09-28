import "server-only";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { emailProvider } from "@/integrations/email";
import { formatCents } from "@/lib/money";

async function alreadyProcessed(eventId: string): Promise<boolean> {
  const existing = await db.webhookEvent.findUnique({
    where: { provider_eventId: { provider: "STRIPE", eventId } },
  });
  return Boolean(existing);
}

async function recordEvent(eventId: string, type: string): Promise<void> {
  await db.webhookEvent.create({ data: { provider: "STRIPE", eventId, type, status: "PROCESSED" } });
}

async function markOrderPaidAndFulfill(orderId: string, amountCents: number, stripePaymentIntentId: string | null) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    console.error("[stripe-webhook] order not found for id", orderId);
    return;
  }

  // Stripe fires both `checkout.session.completed` and the underlying
  // `payment_intent.succeeded` for a Checkout Session payment, often within
  // milliseconds of each other — both webhook deliveries reach us and both
  // resolve this same orderId. A check-then-write on order.status here is a
  // classic TOCTOU race (confirmed in testing: it double-decremented
  // inventory and sent two confirmation emails for one order). The
  // conditional `updateMany` below is the atomic guard: only the delivery
  // that actually flips PENDING_PAYMENT -> PAID proceeds past it, because a
  // concurrent transaction attempting the same updateMany blocks on the row
  // lock and then matches zero rows once the first has committed.
  const won = await db.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING_PAYMENT" },
      data: {
        status: "PAID",
        placedAt: new Date(),
        stripePaymentIntentId: stripePaymentIntentId ?? order.stripePaymentIntentId,
      },
    });

    if (count === 0) return false;

    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "STRIPE",
        stripePaymentIntentId: stripePaymentIntentId ?? undefined,
        amountCents,
        status: "SUCCEEDED",
      },
    });

    if (order.fulfillmentType === "SHIPPING") {
      for (const item of order.items) {
        const inventories = await tx.inventory.findMany({
          where: { productVariantId: item.productVariantId, trackInventory: true },
        });
        for (const inv of inventories) {
          if (inv.quantityOnHand <= 0) continue;
          const decrement = Math.min(inv.quantityOnHand, item.quantity);
          await tx.inventory.update({ where: { id: inv.id }, data: { quantityOnHand: { decrement } } });
        }
      }
    }

    if (order.sourceCartId) {
      await tx.cart.update({ where: { id: order.sourceCartId }, data: { status: "CONVERTED" } }).catch(() => undefined);
    }

    return true;
  });

  if (won) {
    await sendOrderConfirmationEmail(order.id);
  }
}

async function sendOrderConfirmationEmail(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;

  const itemLines = order.items
    .map((item) => `${item.quantity}x ${item.productNameSnapshot} (${item.variantNameSnapshot})`)
    .join("\n");

  const isPickup = order.fulfillmentType === "PICKUP";

  try {
    await emailProvider.send({
      to: order.contactEmail,
      subject: `Order confirmed — ${order.orderNumber}`,
      text: `Thanks for your order!\n\nOrder ${order.orderNumber}\n${itemLines}\n\nTotal: ${formatCents(order.totalCents)}\n\n${
        isPickup
          ? "We'll have it ready for pickup at Sultan Nut House, 1836 N University Dr, Plantation, FL 33322."
          : "We'll email you tracking info once it ships."
      }`,
      html: `<p>Thanks for your order!</p><p><strong>Order ${order.orderNumber}</strong></p><pre>${itemLines}</pre><p>Total: ${formatCents(
        order.totalCents,
      )}</p><p>${
        isPickup
          ? "We'll have it ready for pickup at Sultan Nut House, 1836 N University Dr, Plantation, FL 33322."
          : "We'll email you tracking info once it ships."
      }</p>`,
    });
  } catch (error) {
    console.error("[stripe-webhook] failed to send confirmation email", error);
  }
}

export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  if (await alreadyProcessed(event.id)) return;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (session.payment_status === "paid" && orderId) {
        await markOrderPaidAndFulfill(orderId, session.amount_total ?? 0, session.payment_intent as string | null);
      }
      break;
    }

    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;
      if (orderId) {
        await markOrderPaidAndFulfill(orderId, intent.amount, intent.id);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      // Deliberately not cancelling the order here. A failed attempt (e.g. a
      // declined card) is not terminal — Stripe Checkout lets the customer
      // retry with a different payment method on the *same* session, and a
      // `checkout.session.completed` for the same orderId can still follow
      // seconds later. Cancelling on the first failure raced a real
      // customer's successful retry: their payment succeeded, but
      // markOrderPaidAndFulfill's guard (status must be PENDING_PAYMENT) was
      // already tripped by the cancellation, so the order silently never
      // got marked paid. `checkout.session.expired` below is the actual
      // terminal signal for an abandoned Checkout Session.
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await db.order.updateMany({ where: { id: orderId, status: "PENDING_PAYMENT" }, data: { status: "CANCELLED" } });
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (paymentIntentId) {
        await db.order.updateMany({ where: { stripePaymentIntentId: paymentIntentId }, data: { status: "REFUNDED" } });
        await db.payment.updateMany({ where: { stripePaymentIntentId: paymentIntentId }, data: { status: "REFUNDED" } });
      }
      break;
    }

    default:
      break;
  }

  await recordEvent(event.id, event.type);
}
