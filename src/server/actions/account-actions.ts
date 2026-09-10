"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-guards";
import { hashPassword, verifyPassword } from "@/lib/password";
import { AppError, toSafeError } from "@/lib/errors";
import { addItemToCart } from "@/server/services/cart-service";
import {
  changePasswordSchema,
  savedAddressSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type SavedAddressInput,
  type UpdateProfileInput,
} from "@/validation/account";
import type { ActionResult } from "@/server/actions/auth-actions";

export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = updateProfileSchema.parse(input);

    await db.user.update({ where: { id: user.id }, data: { name: parsed.name, phone: parsed.phone || null } });

    revalidatePath("/account/profile");
    return { success: true, message: "Profile updated." };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't update your profile.");
    return { success: false, message: safeError.userMessage };
  }
}

export async function changePassword(input: ChangePasswordInput): Promise<ActionResult> {
  try {
    const sessionUser = await requireUser();
    const parsed = changePasswordSchema.parse(input);

    const user = await db.user.findUnique({ where: { id: sessionUser.id } });
    if (!user?.passwordHash) {
      throw new AppError("We couldn't verify your current password.", "NO_PASSWORD_SET");
    }

    const isValid = await verifyPassword(user.passwordHash, parsed.currentPassword);
    if (!isValid) {
      throw new AppError("Your current password isn't right.", "INVALID_CURRENT_PASSWORD");
    }

    const passwordHash = await hashPassword(parsed.newPassword);

    // Bumping sessionVersion signs this user out everywhere (including the
    // current session, on its next request) — standard practice after a
    // password change.
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });

    return { success: true, message: "Password changed. Please sign in again." };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't change your password.");
    return { success: false, message: safeError.userMessage };
  }
}

export async function listMyOrders() {
  const user = await requireUser();
  return db.order.findMany({
    where: { userId: user.id, status: { not: "PENDING_PAYMENT" } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMyOrder(orderNumber: string) {
  const user = await requireUser();
  return db.order.findFirst({
    where: { orderNumber, userId: user.id },
    include: { items: { include: { modifiers: true } }, shippingAddress: true },
  });
}

export interface ReorderResult extends ActionResult {
  skippedItems?: string[];
}

export async function reorder(orderNumber: string): Promise<ReorderResult> {
  try {
    const user = await requireUser();
    const order = await db.order.findFirst({
      where: { orderNumber, userId: user.id },
      include: { items: { include: { modifiers: true } } },
    });

    if (!order) throw new AppError("Order not found.", "ORDER_NOT_FOUND");

    const skippedItems: string[] = [];

    for (const item of order.items) {
      try {
        await addItemToCart({
          channel: order.fulfillmentType,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          notes: item.notes ?? undefined,
          modifierOptionIds: item.modifiers.map((m) => m.modifierOptionId).filter((id): id is string => Boolean(id)),
        });
      } catch {
        skippedItems.push(item.productNameSnapshot);
      }
    }

    if (skippedItems.length === order.items.length) {
      return { success: false, message: "None of these items are available anymore." };
    }

    return {
      success: true,
      message: skippedItems.length > 0 ? "Added what's still available to your cart." : "Added to your cart.",
      skippedItems,
    };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't reorder this.");
    return { success: false, message: safeError.userMessage };
  }
}

export async function listMyAddresses() {
  const user = await requireUser();
  return db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
}

export async function saveAddress(input: SavedAddressInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = savedAddressSchema.parse(input);

    await db.$transaction(async (tx) => {
      if (parsed.isDefault) {
        await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      }

      const data = {
        recipientName: parsed.recipientName,
        line1: parsed.line1,
        line2: parsed.line2 || null,
        city: parsed.city,
        state: parsed.state,
        postalCode: parsed.postalCode,
        country: parsed.country,
        phone: parsed.phone || null,
        isDefault: parsed.isDefault,
      };

      if (parsed.id) {
        const existing = await tx.address.findFirst({ where: { id: parsed.id, userId: user.id } });
        if (!existing) throw new AppError("Address not found.", "ADDRESS_NOT_FOUND");
        await tx.address.update({ where: { id: parsed.id }, data });
      } else {
        await tx.address.create({ data: { ...data, user: { connect: { id: user.id } } } });
      }
    });

    revalidatePath("/account/addresses");
    return { success: true, message: "Address saved." };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't save this address.");
    return { success: false, message: safeError.userMessage };
  }
}

export async function deleteAddress(addressId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();

    const existing = await db.address.findFirst({ where: { id: addressId, userId: user.id } });
    if (!existing) throw new AppError("Address not found.", "ADDRESS_NOT_FOUND");

    await db.address.delete({ where: { id: addressId } });

    revalidatePath("/account/addresses");
    return { success: true, message: "Address removed." };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't remove this address.");
    return { success: false, message: safeError.userMessage };
  }
}
