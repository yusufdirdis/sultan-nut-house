import { AppError } from "@/lib/errors";

export type ProductFulfillmentType = "PICKUP_ONLY" | "SHIPPING_ONLY" | "BOTH";
export type FulfillmentChannel = "PICKUP" | "SHIPPING";

/**
 * The single place that decides whether a product may enter a given cart.
 * Called from the addItemToCart server action — never inferred from which
 * page/route a customer used, so a latte can never accidentally ship and a
 * shippable-only good can never enter a pickup order.
 */
export function assertProductAllowedInCart(
  productFulfillmentType: ProductFulfillmentType,
  cartChannel: FulfillmentChannel,
): void {
  const allowed =
    productFulfillmentType === "BOTH" ||
    (productFulfillmentType === "PICKUP_ONLY" && cartChannel === "PICKUP") ||
    (productFulfillmentType === "SHIPPING_ONLY" && cartChannel === "SHIPPING");

  if (!allowed) {
    throw new AppError(
      cartChannel === "SHIPPING"
        ? "This item is only available for pickup at our Plantation cafe and can't be shipped."
        : "This item is only available for shipping and can't be ordered for pickup.",
      "FULFILLMENT_NOT_ALLOWED",
    );
  }
}
