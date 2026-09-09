"use server";

import { revalidatePath } from "next/cache";
import * as cartService from "@/server/services/cart-service";
import { addToCartSchema, type AddToCartInput } from "@/validation/cart";
import { toSafeError } from "@/lib/errors";
import type { FulfillmentChannel } from "@/generated/prisma/enums";

export interface CartActionResult {
  success: boolean;
  message?: string;
}

const CART_PATHS: Record<FulfillmentChannel, string> = {
  PICKUP: "/pickup-cart",
  SHIPPING: "/cart",
};

export async function addToCart(input: AddToCartInput): Promise<CartActionResult> {
  try {
    const parsed = addToCartSchema.parse(input);
    await cartService.addItemToCart(parsed);
    revalidatePath(CART_PATHS[parsed.channel]);
    return { success: true };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't add that to your cart. Please try again.");
    return { success: false, message: safeError.userMessage };
  }
}

export async function updateCartItemQuantity(
  channel: FulfillmentChannel,
  cartItemId: string,
  quantity: number,
): Promise<CartActionResult> {
  try {
    await cartService.updateCartItemQuantity(channel, cartItemId, quantity);
    revalidatePath(CART_PATHS[channel]);
    return { success: true };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't update your cart.");
    return { success: false, message: safeError.userMessage };
  }
}

export async function removeCartItem(channel: FulfillmentChannel, cartItemId: string): Promise<CartActionResult> {
  try {
    await cartService.removeCartItem(channel, cartItemId);
    revalidatePath(CART_PATHS[channel]);
    return { success: true };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't update your cart.");
    return { success: false, message: safeError.userMessage };
  }
}
