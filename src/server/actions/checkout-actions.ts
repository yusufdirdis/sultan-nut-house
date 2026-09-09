"use server";

import * as checkoutService from "@/server/services/checkout-service";
import { quoteShippingSchema, startPickupCheckoutSchema, startShippingCheckoutSchema } from "@/validation/checkout";
import { toSafeError } from "@/lib/errors";
import type { ShippingAddressInput } from "@/validation/checkout";
import type { ShippingRateOption } from "@/integrations/shipping/types";

export interface CheckoutActionResult<T = undefined> {
  success: boolean;
  message?: string;
  data?: T;
}

export async function quoteShipping(shippingAddress: ShippingAddressInput): Promise<CheckoutActionResult<ShippingRateOption[]>> {
  try {
    const parsed = quoteShippingSchema.parse({ shippingAddress });
    const rates = await checkoutService.getShippingRatesForCart(parsed.shippingAddress);
    if (rates.length === 0) {
      return { success: false, message: "We couldn't find a shipping rate for that address. Please check it and try again." };
    }
    return { success: true, data: rates };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't calculate shipping for that address.");
    return { success: false, message: safeError.userMessage };
  }
}

export async function startShippingCheckout(
  input: unknown,
): Promise<CheckoutActionResult<{ redirectUrl: string }>> {
  try {
    const parsed = startShippingCheckoutSchema.parse(input);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const result = await checkoutService.startShippingCheckout(parsed, siteUrl);
    return { success: true, data: result };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't start checkout. Your card has not been charged.");
    return { success: false, message: safeError.userMessage };
  }
}

export async function startPickupCheckout(
  input: unknown,
): Promise<CheckoutActionResult<{ clientSecret: string; orderNumber: string }>> {
  try {
    const parsed = startPickupCheckoutSchema.parse(input);
    const result = await checkoutService.startPickupCheckout(parsed);
    return { success: true, data: result };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't start checkout. Your card has not been charged.");
    return { success: false, message: safeError.userMessage };
  }
}
