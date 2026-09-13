"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { AppError, toSafeError } from "@/lib/errors";
import { productInputSchema, type ProductInput } from "@/validation/admin-product";
import type { ActionResult } from "@/server/actions/auth-actions";

export async function listAdminProducts() {
  await requireAdmin();

  return db.product.findMany({
    include: {
      category: true,
      variants: { orderBy: { position: "asc" } },
      images: { orderBy: { position: "asc" }, take: 1 },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}

export async function getAdminProduct(id: string) {
  await requireAdmin();

  return db.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { position: "asc" } },
      images: { orderBy: { position: "asc" } },
      modifierGroups: { select: { modifierGroupId: true } },
    },
  });
}

export async function listCategoriesForAdmin() {
  await requireAdmin();
  return db.category.findMany({ orderBy: [{ kind: "asc" }, { position: "asc" }] });
}

export async function listModifierGroupsForAdmin() {
  await requireAdmin();
  return db.modifierGroup.findMany({
    include: { options: { orderBy: { position: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export async function saveProduct(input: ProductInput): Promise<ActionResult & { productId?: string }> {
  try {
    const admin = await requireAdmin();
    const parsed = productInputSchema.parse(input);

    const defaultCount = parsed.variants.filter((variant) => variant.isDefault).length;
    if (defaultCount === 0) parsed.variants[0].isDefault = true;

    const product = await db.$transaction(async (tx) => {
      const existingBySlug = await tx.product.findUnique({ where: { slug: parsed.slug } });
      if (existingBySlug && existingBySlug.id !== parsed.id) {
        throw new AppError(`The slug "${parsed.slug}" is already used by another product.`, "SLUG_TAKEN");
      }

      const data = {
        slug: parsed.slug,
        name: parsed.name,
        description: parsed.description || null,
        fulfillmentType: parsed.fulfillmentType,
        status: parsed.status,
        categoryId: parsed.categoryId || null,
        allergenInfo: parsed.allergenInfo || null,
        ingredients: parsed.ingredients || null,
        storageInstructions: parsed.storageInstructions || null,
      };

      const saved = parsed.id
        ? await tx.product.update({ where: { id: parsed.id }, data })
        : await tx.product.create({ data });

      // --- Variants: upsert existing, create new, remove dropped ones -----
      const keepVariantIds = parsed.variants.map((variant) => variant.id).filter(Boolean) as string[];

      const removableVariants = await tx.productVariant.findMany({
        where: { productId: saved.id, id: { notIn: keepVariantIds } },
      });

      for (const variant of removableVariants) {
        const referenced = await tx.orderItem.findFirst({ where: { productVariantId: variant.id } });
        if (referenced) {
          throw new AppError(
            `"${variant.name}" has past orders and can't be removed — set the product to Archived instead, or mark this variant unavailable.`,
            "VARIANT_HAS_ORDERS",
          );
        }
      }

      if (removableVariants.length > 0) {
        const removableVariantIds = removableVariants.map((v) => v.id);
        // Carts are transient — unlike OrderItem (a permanent record, guarded
        // above), a live CartItem can reference this variant too (e.g. an
        // abandoned cart) and has no cascade. Drop those cart items rather
        // than blocking the admin from editing the catalog; cascades clean
        // up their modifiers/reservations.
        await tx.cartItem.deleteMany({ where: { productVariantId: { in: removableVariantIds } } });
        await tx.productVariant.deleteMany({ where: { id: { in: removableVariantIds } } });
      }

      for (const [index, variant] of parsed.variants.entries()) {
        const variantData = {
          sku: variant.sku,
          name: variant.name,
          priceCents: variant.priceCents,
          compareAtPriceCents: variant.compareAtPriceCents ?? null,
          weightGrams: variant.weightGrams ?? null,
          isDefault: variant.isDefault,
          isAvailable: variant.isAvailable,
          position: index,
          productId: saved.id,
        };

        if (variant.id) {
          await tx.productVariant.update({ where: { id: variant.id }, data: variantData });
        } else {
          await tx.productVariant.create({ data: variantData });
        }
      }

      // --- Images: simplest safe approach is replace-all -------------------
      await tx.productImage.deleteMany({ where: { productId: saved.id } });
      if (parsed.images.length > 0) {
        await tx.productImage.createMany({
          data: parsed.images.map((image, index) => ({
            productId: saved.id,
            url: image.url,
            altText: image.altText || null,
            position: index,
          })),
        });
      }

      // --- Modifier group assignments --------------------------------------
      await tx.productModifierGroup.deleteMany({ where: { productId: saved.id } });
      if (parsed.modifierGroupIds.length > 0) {
        await tx.productModifierGroup.createMany({
          data: parsed.modifierGroupIds.map((modifierGroupId, index) => ({
            productId: saved.id,
            modifierGroupId,
            position: index,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: parsed.id ? "PRODUCT_UPDATED" : "PRODUCT_CREATED",
          entityType: "Product",
          entityId: saved.id,
          afterJson: { name: saved.name, slug: saved.slug, status: saved.status },
        },
      });

      return saved;
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${product.id}/edit`);

    return { success: true, message: "Product saved.", productId: product.id };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't save this product. Please try again.");
    return { success: false, message: safeError.userMessage };
  }
}

export async function setProductStatus(productId: string, status: "ACTIVE" | "DRAFT" | "ARCHIVED"): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    const product = await db.product.update({ where: { id: productId }, data: { status } });

    await db.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: "PRODUCT_STATUS_CHANGED",
        entityType: "Product",
        entityId: product.id,
        afterJson: { status },
      },
    });

    revalidatePath("/admin/products");
    return { success: true, message: status === "ARCHIVED" ? "Product archived." : "Product updated." };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't update this product.");
    return { success: false, message: safeError.userMessage };
  }
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    const hasOrders = await db.orderItem.findFirst({
      where: { productVariant: { productId } },
    });

    if (hasOrders) {
      throw new AppError(
        "This product has past orders and can't be permanently deleted — archive it instead to hide it from customers.",
        "PRODUCT_HAS_ORDERS",
      );
    }

    await db.product.delete({ where: { id: productId } });

    await db.auditLog.create({
      data: { actorUserId: admin.id, action: "PRODUCT_DELETED", entityType: "Product", entityId: productId },
    });

    revalidatePath("/admin/products");
    return { success: true, message: "Product deleted." };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't delete this product.");
    return { success: false, message: safeError.userMessage };
  }
}
