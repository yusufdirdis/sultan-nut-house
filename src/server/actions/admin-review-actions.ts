"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { AppError, toSafeError } from "@/lib/errors";
import { reviewInputSchema, type ReviewInput } from "@/validation/admin-review";
import type { ActionResult } from "@/server/actions/auth-actions";

export async function listReviewsForAdmin() {
  await requireAdmin();
  return db.review.findMany({ orderBy: { position: "asc" } });
}

export async function saveReview(input: ReviewInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = reviewInputSchema.parse(input);

    const data = {
      authorName: parsed.authorName,
      rating: parsed.rating,
      body: parsed.body,
      googleReviewUrl: parsed.googleReviewUrl,
      isVisible: parsed.isVisible,
    };

    let review;
    if (parsed.id) {
      review = await db.review.update({ where: { id: parsed.id }, data });
    } else {
      const last = await db.review.findFirst({ orderBy: { position: "desc" } });
      review = await db.review.create({ data: { ...data, position: (last?.position ?? -1) + 1 } });
    }

    await db.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: parsed.id ? "REVIEW_UPDATED" : "REVIEW_CREATED",
        entityType: "Review",
        entityId: review.id,
        afterJson: { authorName: review.authorName, rating: review.rating },
      },
    });

    revalidatePath("/admin/reviews");
    revalidatePath("/");
    return { success: true, message: "Review saved." };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't save this review.");
    return { success: false, message: safeError.userMessage };
  }
}

export async function moveReview(reviewId: string, direction: "up" | "down"): Promise<ActionResult> {
  try {
    await requireAdmin();

    const review = await db.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new AppError("Review not found.", "REVIEW_NOT_FOUND");

    const neighbor = await db.review.findFirst({
      where: { position: direction === "up" ? { lt: review.position } : { gt: review.position } },
      orderBy: { position: direction === "up" ? "desc" : "asc" },
    });

    if (!neighbor) return { success: true, message: "Already at the edge." };

    await db.$transaction([
      db.review.update({ where: { id: review.id }, data: { position: neighbor.position } }),
      db.review.update({ where: { id: neighbor.id }, data: { position: review.position } }),
    ]);

    revalidatePath("/admin/reviews");
    revalidatePath("/");
    return { success: true, message: "Reordered." };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't reorder this review.");
    return { success: false, message: safeError.userMessage };
  }
}

export async function deleteReview(reviewId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    await db.review.delete({ where: { id: reviewId } });

    await db.auditLog.create({
      data: { actorUserId: admin.id, action: "REVIEW_DELETED", entityType: "Review", entityId: reviewId },
    });

    revalidatePath("/admin/reviews");
    revalidatePath("/");
    return { success: true, message: "Review deleted." };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't delete this review.");
    return { success: false, message: safeError.userMessage };
  }
}
