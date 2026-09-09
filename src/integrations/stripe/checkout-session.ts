import "server-only";
import Stripe from "stripe";
import { stripe } from "@/integrations/stripe/client";

export interface CheckoutLineItem {
  name: string;
  description?: string;
  quantity: number;
  unitAmountCents: number;
}

export interface CreateShippingCheckoutSessionInput {
  orderId: string;
  orderNumber: string;
  customerEmail?: string;
  lineItems: CheckoutLineItem[];
  shippingCents: number;
  taxCents: number;
  successUrl: string;
  cancelUrl: string;
}

export async function createShippingCheckoutSession(input: CreateShippingCheckoutSessionInput): Promise<Stripe.Checkout.Session> {
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = input.lineItems.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: "usd",
      unit_amount: item.unitAmountCents,
      product_data: { name: item.name, description: item.description },
    },
  }));

  if (input.shippingCents > 0) {
    line_items.push({
      quantity: 1,
      price_data: { currency: "usd", unit_amount: input.shippingCents, product_data: { name: "Shipping" } },
    });
  }

  if (input.taxCents > 0) {
    line_items.push({
      quantity: 1,
      price_data: { currency: "usd", unit_amount: input.taxCents, product_data: { name: "Sales tax" } },
    });
  }

  return stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items,
      customer_email: input.customerEmail,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: { orderId: input.orderId, orderNumber: input.orderNumber },
      payment_intent_data: { metadata: { orderId: input.orderId, orderNumber: input.orderNumber } },
    },
    { idempotencyKey: `checkout-session-${input.orderId}` },
  );
}
