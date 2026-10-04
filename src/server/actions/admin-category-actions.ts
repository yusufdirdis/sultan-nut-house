"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { AppError, toSafeError } from "@/lib/errors";
import { revalidateStorefront } from "@/lib/revalidate-storefront";
import { categoryInputSchema, type CategoryInput } from "@/validation/admin-category";
import type { ActionResult } from "@/server/actions/auth-actions";

export async function saveCategory(input: CategoryInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = categoryInputSchema.parse(input);

    const existingBySlug = await db.category.findUnique({ where: { slug: parsed.slug } });
    if (existingBySlug && existingBySlug.id !== parsed.id) {
      throw new AppError(`The slug "${parsed.slug}" is already in use.`, "SLUG_TAKEN");
    }

    const data = {
      kind: parsed.kind,
      slug: parsed.slug,
      name: parsed.name,
      description: parsed.description || null,
      imageUrl: parsed.imageUrl || null,
      isVisible: parsed.isVisible,
    };

    let category;
    if (parsed.id) {
      category = await db.category.update({ where: { id: parsed.id }, data });
    } else {
      const last = await db.category.findFirst({ where: { kind: parsed.kind }, orderBy: { position: "desc" } });
      category = await db.category.create({ data: { ...data, position: (last?.position ?? -1) + 1 } });
    }

    await db.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: parsed.id ? "CATEGORY_UPDATED" : "CATEGORY_CREATED",
        entityType: "Category",
        entityId: category.id,
        afterJson: { name: category.name, slug: category.slug },
      },
    });

    revalidatePath("/admin/categories");
    revalidateStorefront();
    return { success: true, message: "Category saved." };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't save this category.");
    return { success: false, message: safeError.userMessage };
  }
}

export async function moveCategory(categoryId: string, direction: "up" | "down"): Promise<ActionResult> {
  try {
    await requireAdmin();

    const category = await db.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new AppError("Category not found.", "CATEGORY_NOT_FOUND");

    const neighbor = await db.category.findFirst({
      where: { kind: category.kind, position: direction === "up" ? { lt: category.position } : { gt: category.position } },
      orderBy: { position: direction === "up" ? "desc" : "asc" },
    });

    if (!neighbor) return { success: true, message: "Already at the edge." };

    await db.$transaction([
      db.category.update({ where: { id: category.id }, data: { position: neighbor.position } }),
      db.category.update({ where: { id: neighbor.id }, data: { position: category.position } }),
    ]);

    revalidatePath("/admin/categories");
    revalidateStorefront();
    return { success: true, message: "Reordered." };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't reorder this category.");
    return { success: false, message: safeError.userMessage };
  }
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    const productCount = await db.product.count({ where: { categoryId } });
    if (productCount > 0) {
      throw new AppError(
        `This category still has ${productCount} product(s) assigned — move or delete them first.`,
        "CATEGORY_IN_USE",
      );
    }

    await db.category.delete({ where: { id: categoryId } });

    await db.auditLog.create({
      data: { actorUserId: admin.id, action: "CATEGORY_DELETED", entityType: "Category", entityId: categoryId },
    });

    revalidatePath("/admin/categories");
    revalidateStorefront();
    return { success: true, message: "Category deleted." };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't delete this category.");
    return { success: false, message: safeError.userMessage };
  }
}
