import "server-only";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { readGuestCartToken, issueGuestCartToken } from "@/lib/cart-cookies";
import { assertProductAllowedInCart } from "@/domain/cart/cartFulfillmentRules";
import { validateModifierSelections, type ModifierGroupRules } from "@/domain/cart/validateModifierSelections";
import { calculateCartSubtotalCents } from "@/domain/pricing/calculateLineItemTotal";
import { AppError } from "@/lib/errors";
import type { FulfillmentChannel } from "@/generated/prisma/enums";

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      productVariant: { include: { product: { include: { images: { orderBy: { position: "asc" as const }, take: 1 } } } } },
      modifiers: { include: { modifierOption: { include: { modifierGroup: true } } } },
    },
  },
};

export type CartWithItems = NonNullable<Awaited<ReturnType<typeof getActiveCart>>>;

async function ownerWhere(channel: FulfillmentChannel) {
  const session = await auth();

  if (session?.user) {
    return { userId: session.user.id, type: channel, status: "ACTIVE" as const };
  }

  const guestToken = await readGuestCartToken(channel);
  if (!guestToken) return null;

  return { guestToken, type: channel, status: "ACTIVE" as const };
}

export async function getActiveCart(channel: FulfillmentChannel) {
  const where = await ownerWhere(channel);
  if (!where) return null;

  return db.cart.findFirst({ where, include: cartInclude });
}

async function getOrCreateCart(channel: FulfillmentChannel) {
  const existing = await getActiveCart(channel);
  if (existing) return existing;

  const session = await auth();

  const cart = session?.user
    ? await db.cart.create({
        data: { type: channel, status: "ACTIVE", user: { connect: { id: session.user.id } } },
        include: cartInclude,
      })
    : await db.cart.create({
        data: { type: channel, status: "ACTIVE", guestToken: await issueGuestCartToken(channel) },
        include: cartInclude,
      });

  return cart;
}

export interface AddItemInput {
  channel: FulfillmentChannel;
  productVariantId: string;
  quantity: number;
  notes?: string;
  modifierOptionIds: string[];
}

export async function addItemToCart(input: AddItemInput) {
  if (input.quantity < 1) throw new AppError("Quantity must be at least 1.", "INVALID_QUANTITY");

  const variant = await db.productVariant.findUnique({
    where: { id: input.productVariantId },
    include: {
      product: {
        include: {
          modifierGroups: { include: { modifierGroup: { include: { options: true } } } },
        },
      },
    },
  });

  if (!variant || !variant.isAvailable || variant.product.status !== "ACTIVE") {
    throw new AppError("This item is no longer available.", "PRODUCT_UNAVAILABLE");
  }

  assertProductAllowedInCart(variant.product.fulfillmentType, input.channel);

  const groupRules: ModifierGroupRules[] = variant.product.modifierGroups.map((link) => ({
    id: link.modifierGroup.id,
    name: link.modifierGroup.name,
    selectionType: link.modifierGroup.selectionType,
    minSelect: link.modifierGroup.minSelect,
    maxSelect: link.modifierGroup.maxSelect,
    required: link.modifierGroup.required,
    availableOptionIds: link.modifierGroup.options.filter((o) => o.isAvailable).map((o) => o.id),
  }));

  const selectedOptions = variant.product.modifierGroups
    .flatMap((link) => link.modifierGroup.options)
    .filter((option) => input.modifierOptionIds.includes(option.id));

  const selectionsByGroup = new Map<string, string[]>();
  for (const option of selectedOptions) {
    const list = selectionsByGroup.get(option.modifierGroupId) ?? [];
    list.push(option.id);
    selectionsByGroup.set(option.modifierGroupId, list);
  }

  validateModifierSelections(
    groupRules,
    Array.from(selectionsByGroup.entries()).map(([modifierGroupId, optionIds]) => ({ modifierGroupId, optionIds })),
  );

  const cart = await getOrCreateCart(input.channel);

  const sortedNewOptionIds = [...selectedOptions.map((o) => o.id)].sort();
  const existingMatch = cart.items.find((item) => {
    if (item.productVariantId !== input.productVariantId) return false;
    if (item.notes !== (input.notes || null)) return false;
    const existingIds = [...item.modifiers.map((m) => m.modifierOptionId)].sort();
    return existingIds.length === sortedNewOptionIds.length && existingIds.every((id, i) => id === sortedNewOptionIds[i]);
  });

  if (existingMatch) {
    await db.cartItem.update({ where: { id: existingMatch.id }, data: { quantity: existingMatch.quantity + input.quantity } });
  } else {
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        productVariantId: input.productVariantId,
        quantity: input.quantity,
        unitPriceCentsSnapshot: variant.priceCents,
        notes: input.notes || null,
        modifiers: {
          create: selectedOptions.map((option) => ({ modifierOptionId: option.id, priceDeltaCentsSnapshot: option.priceDeltaCents })),
        },
      },
    });
  }

  return getActiveCart(input.channel);
}

export async function updateCartItemQuantity(channel: FulfillmentChannel, cartItemId: string, quantity: number) {
  const cart = await getActiveCart(channel);
  if (!cart || !cart.items.some((item) => item.id === cartItemId)) {
    throw new AppError("That item isn't in your cart.", "CART_ITEM_NOT_FOUND");
  }

  if (quantity < 1) {
    await db.cartItem.delete({ where: { id: cartItemId } });
  } else {
    await db.cartItem.update({ where: { id: cartItemId }, data: { quantity } });
  }

  return getActiveCart(channel);
}

export async function removeCartItem(channel: FulfillmentChannel, cartItemId: string) {
  const cart = await getActiveCart(channel);
  if (!cart || !cart.items.some((item) => item.id === cartItemId)) {
    throw new AppError("That item isn't in your cart.", "CART_ITEM_NOT_FOUND");
  }

  await db.cartItem.delete({ where: { id: cartItemId } });
  return getActiveCart(channel);
}

export function calculateCartSubtotal(cart: CartWithItems) {
  return calculateCartSubtotalCents(
    cart.items.map((item) => ({
      unitPriceCents: item.unitPriceCentsSnapshot,
      quantity: item.quantity,
      modifiers: item.modifiers.map((m) => ({ priceDeltaCents: m.priceDeltaCentsSnapshot })),
    })),
  );
}
