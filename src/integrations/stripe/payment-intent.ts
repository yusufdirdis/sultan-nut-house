import "server-only";
import Stripe from "stripe";
import { stripe } from "@/integrations/stripe/client";

export interface CreatePickupPaymentIntentInput {
  orderId: string;
  orderNumber: string;
  totalCents: number;
  customerEmail?: string;
}

export async function createPickupPaymentIntent(input: CreatePickupPaymentIntentInput): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create(
    {
      amount: input.totalCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      receipt_email: input.customerEmail,
      metadata: { orderId: input.orderId, orderNumber: input.orderNumber },
    },
    { idempotencyKey: `payment-intent-${input.orderId}` },
  );
}
