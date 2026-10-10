"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { testimonialUpsertSchema } from "@/lib/validation/schemas";
import { checkClaims } from "@/lib/claims/guard";

export async function getAdminTestimonialsAction() {
  await requireAdmin();

  return db
    .select()
    .from(testimonials)
    .orderBy(asc(testimonials.sortOrder), desc(testimonials.createdAt));
}

export async function saveTestimonialAction(input: unknown) {
  await requireAdmin();

  const parsed = testimonialUpsertSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed: " + Object.values(parsed.error.flatten().fieldErrors).flat().join(", "),
    };
  }

  const data = parsed.data;
  const isEditing = Boolean(data.id);
  const testimonialId = data.id || `tst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Run claims check on testimonial text
  const claimCheck = checkClaims({
    name: data.name,
    city: data.city,
    body: data.body,
  });

  if (isEditing) {
    await db
      .update(testimonials)
      .set({
        name: data.name,
        city: data.city || null,
        rating: data.rating,
        body: data.body,
        isPublished: data.isPublished,
        isSample: data.isSample,
        sortOrder: data.sortOrder,
      })
      .where(eq(testimonials.id, data.id!));
  } else {
    await db.insert(testimonials).values({
      id: testimonialId,
      name: data.name,
      city: data.city || null,
      rating: data.rating,
      body: data.body,
      isPublished: data.isPublished,
      isSample: data.isSample,
      sortOrder: data.sortOrder,
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/testimonials");

  return {
    success: true,
    message: `Testimonial by "${data.name}" ${isEditing ? "updated" : "created"} successfully.`,
    testimonialId,
    warning: claimCheck.warning,
  };
}

export async function toggleTestimonialPublishedAction(id: string) {
  await requireAdmin();

  const [t] = await db
    .select()
    .from(testimonials)
    .where(eq(testimonials.id, id))
    .limit(1);

  if (!t) {
    return { success: false, error: "Testimonial not found." };
  }

  const nextPublished = !t.isPublished;

  await db
    .update(testimonials)
    .set({ isPublished: nextPublished })
    .where(eq(testimonials.id, id));

  revalidatePath("/");
  revalidatePath("/admin/testimonials");

  return {
    success: true,
    message: `Testimonial by "${t.name}" is now ${nextPublished ? "Published" : "Unpublished"}.`,
  };
}

export async function deleteTestimonialAction(id: string) {
  await requireAdmin();

  const [t] = await db
    .select()
    .from(testimonials)
    .where(eq(testimonials.id, id))
    .limit(1);

  if (!t) {
    return { success: false, error: "Testimonial not found." };
  }

  await db.delete(testimonials).where(eq(testimonials.id, id));

  revalidatePath("/");
  revalidatePath("/admin/testimonials");

  return {
    success: true,
    message: `Testimonial by "${t.name}" deleted successfully.`,
  };
}
