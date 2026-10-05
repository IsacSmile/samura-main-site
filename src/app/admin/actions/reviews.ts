"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { reviews, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function approveReviewAction(reviewId: string) {
  await requireAdmin();

  if (!reviewId) {
    return { success: false, error: "Review ID is required." };
  }

  const [rev] = await db
    .select({ productId: reviews.productId })
    .from(reviews)
    .where(eq(reviews.id, reviewId))
    .limit(1);

  if (!rev) {
    return { success: false, error: "Review not found." };
  }

  await db
    .update(reviews)
    .set({
      status: "approved",
    })
    .where(eq(reviews.id, reviewId));

  // Find product slug for revalidation
  const [prod] = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.id, rev.productId))
    .limit(1);

  if (prod?.slug) {
    revalidatePath(`/product/${prod.slug}`);
  }
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");

  return {
    success: true,
    message: "Review approved and published to storefront.",
  };
}

export async function rejectReviewAction(reviewId: string) {
  await requireAdmin();

  if (!reviewId) {
    return { success: false, error: "Review ID is required." };
  }

  const [rev] = await db
    .select({ productId: reviews.productId })
    .from(reviews)
    .where(eq(reviews.id, reviewId))
    .limit(1);

  if (!rev) {
    return { success: false, error: "Review not found." };
  }

  await db
    .update(reviews)
    .set({
      status: "rejected",
    })
    .where(eq(reviews.id, reviewId));

  const [prod] = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.id, rev.productId))
    .limit(1);

  if (prod?.slug) {
    revalidatePath(`/product/${prod.slug}`);
  }
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");

  return {
    success: true,
    message: "Review rejected.",
  };
}

export async function deleteReviewAction(reviewId: string) {
  await requireAdmin();

  if (!reviewId) {
    return { success: false, error: "Review ID is required." };
  }

  const [rev] = await db
    .select({ productId: reviews.productId })
    .from(reviews)
    .where(eq(reviews.id, reviewId))
    .limit(1);

  await db.delete(reviews).where(eq(reviews.id, reviewId));

  if (rev?.productId) {
    const [prod] = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.id, rev.productId))
      .limit(1);

    if (prod?.slug) {
      revalidatePath(`/product/${prod.slug}`);
    }
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/admin");

  return {
    success: true,
    message: "Review permanently deleted.",
  };
}
