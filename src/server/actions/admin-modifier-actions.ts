"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { AppError, toSafeError } from "@/lib/errors";
import { modifierGroupInputSchema, type ModifierGroupInput } from "@/validation/admin-modifier";
import type { ActionResult } from "@/server/actions/auth-actions";

export async function getAdminModifierGroup(id: string) {
  await requireAdmin();
  return db.modifierGroup.findUnique({
    where: { id },
    include: { options: { orderBy: { position: "asc" } } },
  });
}

export async function saveModifierGroup(input: ModifierGroupInput): Promise<ActionResult & { groupId?: string }> {
  try {
    const admin = await requireAdmin();
    const parsed = modifierGroupInputSchema.parse(input);

    const group = await db.$transaction(async (tx) => {
      const data = {
        name: parsed.name,
        selectionType: parsed.selectionType,
        minSelect: parsed.minSelect,
        maxSelect: parsed.maxSelect,
        required: parsed.required,
      };

      const saved = parsed.id
        ? await tx.modifierGroup.update({ where: { id: parsed.id }, data })
        : await tx.modifierGroup.create({ data });

      const keepOptionIds = parsed.options.map((option) => option.id).filter(Boolean) as string[];

      const removableOptions = await tx.modifierOption.findMany({
        where: { modifierGroupId: saved.id, id: { notIn: keepOptionIds } },
      });

      for (const option of removableOptions) {
        const referenced = await tx.orderItemModifier.findFirst({ where: { modifierOptionId: option.id } });
        if (referenced) {
          throw new AppError(
            `"${option.name}" has been selected on past orders and can't be removed — mark it unavailable instead.`,
            "MODIFIER_OPTION_HAS_ORDERS",
          );
        }
      }

      if (removableOptions.length > 0) {
        const removableOptionIds = removableOptions.map((o) => o.id);
        // Carts are transient — unlike OrderItemModifier (a permanent record,
        // guarded above), a live CartItemModifier can reference this option
        // too (e.g. an abandoned cart) and has no cascade. Clear those
        // selections rather than blocking the admin from editing the menu;
        // the cart re-validates required modifiers at checkout anyway.
        await tx.cartItemModifier.deleteMany({ where: { modifierOptionId: { in: removableOptionIds } } });
        await tx.modifierOption.deleteMany({ where: { id: { in: removableOptionIds } } });
      }

      for (const [index, option] of parsed.options.entries()) {
        const optionData = {
          name: option.name,
          priceDeltaCents: option.priceDeltaCents,
          isDefault: option.isDefault,
          isAvailable: option.isAvailable,
          position: index,
          modifierGroupId: saved.id,
        };

        if (option.id) {
          await tx.modifierOption.update({ where: { id: option.id }, data: optionData });
        } else {
          await tx.modifierOption.create({ data: optionData });
        }
      }

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: parsed.id ? "MODIFIER_GROUP_UPDATED" : "MODIFIER_GROUP_CREATED",
          entityType: "ModifierGroup",
          entityId: saved.id,
          afterJson: { name: saved.name },
        },
      });

      return saved;
    });

    revalidatePath("/admin/modifiers");
    revalidatePath(`/admin/modifiers/${group.id}/edit`);

    return { success: true, message: "Modifier group saved.", groupId: group.id };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't save this modifier group.");
    return { success: false, message: safeError.userMessage };
  }
}

export async function deleteModifierGroup(groupId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    const inUse = await db.productModifierGroup.count({ where: { modifierGroupId: groupId } });
    if (inUse > 0) {
      throw new AppError(
        `This modifier group is attached to ${inUse} product(s) — remove it from those products first.`,
        "MODIFIER_GROUP_IN_USE",
      );
    }

    await db.modifierGroup.delete({ where: { id: groupId } });

    await db.auditLog.create({
      data: { actorUserId: admin.id, action: "MODIFIER_GROUP_DELETED", entityType: "ModifierGroup", entityId: groupId },
    });

    revalidatePath("/admin/modifiers");
    return { success: true, message: "Modifier group deleted." };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't delete this modifier group.");
    return { success: false, message: safeError.userMessage };
  }
}
