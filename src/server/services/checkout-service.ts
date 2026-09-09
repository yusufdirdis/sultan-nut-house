import "server-only";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { getActiveCart, calculateCartSubtotal, type CartWithItems } from "@/server/services/cart-service";
import { getShippingProvider } from "@/integrations/shipping";
import { flatRateProvider } from "@/integrations/shipping/flat-rate-provider";
import type { ShippingRateOption } from "@/integrations/shipping/types";
import { calculateTaxCents } from "@/domain/tax/calculateTax";
import { generateOrderNumber } from "@/domain/orders/generateOrderNumber";
import { createShippingCheckoutSession } from "@/integrations/stripe/checkout-session";
import { createPickupPaymentIntent } from "@/integrations/stripe/payment-intent";
import type { ShippingAddressInput, StartPickupCheckoutInput, StartShippingCheckoutInput } from "@/validation/checkout";

function assertNonEmptyCart(cart: CartWithItems | null): asserts cart is CartWithItems {
  if (!cart || cart.items.length === 0) {
    throw new AppError("Your cart is empty.", "CART_EMPTY");
  }
}

/**
 * Simplified inventory guard for launch: checks availability at checkout
 * time and decrements on payment success (see stripe webhook handler).
 * The InventoryReservation table exists for a future hold-during-checkout
 * upgrade; not used yet, so there's a small oversell window between
 * checkout start and payment confirmation.
 */
async function assertInventoryAvailable(cart: CartWithItems): Promise<void> {
  for (const item of cart.items) {
    const inventories = await db.inventory.findMany({
      where: { productVariantId: item.productVariantId, trackInventory: true },
    });
    if (inventories.length === 0) continue;

    const onHand = inventories.reduce((sum, inv) => sum + inv.quantityOnHand, 0);
    if (onHand < item.quantity) {
      throw new AppError(
        `Only ${Math.max(onHand, 0)} of "${item.productVariant.product.name}" left in stock — please update your cart.`,
        "INSUFFICIENT_INVENTORY",
      );
    }
  }
}

export async function getShippingRatesForCart(shippingAddress: ShippingAddressInput): Promise<ShippingRateOption[]> {
  const cart = await getActiveCart("SHIPPING");
  assertNonEmptyCart(cart);

  const items = cart.items.map((item) => ({
    weightGrams: item.productVariant.weightGrams ?? 200,
    quantity: item.quantity,
  }));

  try {
    const provider = getShippingProvider();
    return await provider.getRates({ toAddress: shippingAddress, items });
  } catch (error) {
    console.error("[checkout] live shipping rate lookup failed, falling back to flat rate", error);
    return flatRateProvider.getRates({ toAddress: shippingAddress, items });
  }
}

export async function startShippingCheckout(input: StartShippingCheckoutInput, origin: string) {
  const cart = await getActiveCart("SHIPPING");
  assertNonEmptyCart(cart);
  await assertInventoryAvailable(cart);

  const session = await auth();
  const subtotalCents = calculateCartSubtotal(cart);
  const taxCents = calculateTaxCents({ subtotalCents, channel: "SHIPPING", shippingState: input.shippingAddress.state });
  const totalCents = subtotalCents + taxCents + input.amountCents;

  const address = await db.address.create({
    data: { ...input.shippingAddress, user: session?.user ? { connect: { id: session.user.id } } : undefined },
  });

  const orderNumber = generateOrderNumber("SHIPPING");

  const order = await db.order.create({
    data: {
      orderNumber,
      fulfillmentType: "SHIPPING",
      status: "PENDING_PAYMENT",
      user: session?.user ? { connect: { id: session.user.id } } : undefined,
      contactEmail: input.contactEmail,
      shippingAddress: { connect: { id: address.id } },
      sourceCartId: cart.id,
      shippingServiceName: `${input.carrier} ${input.serviceName}`,
      shippoRateId: input.rateId,
      subtotalCents,
      taxCents,
      shippingCents: input.amountCents,
      discountCents: 0,
      totalCents,
      items: {
        create: cart.items.map((item) => ({
          productVariantId: item.productVariantId,
          productNameSnapshot: item.productVariant.product.name,
          variantNameSnapshot: item.productVariant.name,
          quantity: item.quantity,
          unitPriceCentsSnapshot: item.unitPriceCentsSnapshot,
          notes: item.notes,
          modifiers: {
            create: item.modifiers.map((m) => ({
              modifierOptionId: m.modifierOptionId,
              modifierOptionNameSnapshot: m.modifierOption.name,
              priceDeltaCentsSnapshot: m.priceDeltaCentsSnapshot,
            })),
          },
        })),
      },
    },
  });

  const checkoutSession = await createShippingCheckoutSession({
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerEmail: input.contactEmail,
    lineItems: cart.items.map((item) => ({
      name: item.productVariant.product.name,
      description: item.productVariant.name,
      quantity: item.quantity,
      unitAmountCents: item.unitPriceCentsSnapshot + item.modifiers.reduce((s, m) => s + m.priceDeltaCentsSnapshot, 0),
    })),
    shippingCents: input.amountCents,
    taxCents,
    successUrl: `${origin}/checkout/success?order=${order.orderNumber}`,
    cancelUrl: `${origin}/cart`,
  });

  await db.order.update({ where: { id: order.id }, data: { stripeCheckoutSessionId: checkoutSession.id } });

  if (!checkoutSession.url) {
    throw new AppError("We couldn't start checkout. Please try again.", "STRIPE_SESSION_NO_URL");
  }

  return { redirectUrl: checkoutSession.url };
}

export async function startPickupCheckout(input: StartPickupCheckoutInput) {
  const cart = await getActiveCart("PICKUP");
  assertNonEmptyCart(cart);

  const session = await auth();
  const subtotalCents = calculateCartSubtotal(cart);
  const taxCents = calculateTaxCents({ subtotalCents, channel: "PICKUP" });
  const totalCents = subtotalCents + taxCents;

  const orderNumber = generateOrderNumber("PICKUP");

  const order = await db.order.create({
    data: {
      orderNumber,
      fulfillmentType: "PICKUP",
      status: "PENDING_PAYMENT",
      user: session?.user ? { connect: { id: session.user.id } } : undefined,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      sourceCartId: cart.id,
      pickupTime: new Date(),
      notes: input.notes,
      subtotalCents,
      taxCents,
      shippingCents: 0,
      discountCents: 0,
      totalCents,
      items: {
        create: cart.items.map((item) => ({
          productVariantId: item.productVariantId,
          productNameSnapshot: item.productVariant.product.name,
          variantNameSnapshot: item.productVariant.name,
          quantity: item.quantity,
          unitPriceCentsSnapshot: item.unitPriceCentsSnapshot,
          notes: item.notes,
          modifiers: {
            create: item.modifiers.map((m) => ({
              modifierOptionId: m.modifierOptionId,
              modifierOptionNameSnapshot: m.modifierOption.name,
              priceDeltaCentsSnapshot: m.priceDeltaCentsSnapshot,
            })),
          },
        })),
      },
    },
  });

  const paymentIntent = await createPickupPaymentIntent({
    orderId: order.id,
    orderNumber: order.orderNumber,
    totalCents,
    customerEmail: input.contactEmail,
  });

  await db.order.update({ where: { id: order.id }, data: { stripePaymentIntentId: paymentIntent.id } });

  if (!paymentIntent.client_secret) {
    throw new AppError("We couldn't start checkout. Please try again.", "STRIPE_INTENT_NO_SECRET");
  }

  return { clientSecret: paymentIntent.client_secret, orderNumber: order.orderNumber };
}
