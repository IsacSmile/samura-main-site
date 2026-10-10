import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import {
  DEFAULT_STOREFRONT_TESTIMONIALS,
  type StorefrontTestimonial,
} from "@/config/testimonials";

export { DEFAULT_STOREFRONT_TESTIMONIALS };
export type { StorefrontTestimonial };

/**
 * Retrieves testimonials for the storefront carousel.
 * Enforces strict environment separation:
 * - In production: strictly isPublished = true AND isSample = false, regardless of DB state.
 * - Outside production: isPublished = true (samples display with a visible "Sample" tag).
 */
export async function getStorefrontTestimonials(): Promise<StorefrontTestimonial[]> {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    return db
      .select()
      .from(testimonials)
      .where(and(eq(testimonials.isPublished, true), eq(testimonials.isSample, false)))
      .orderBy(asc(testimonials.sortOrder), desc(testimonials.createdAt));
  }

  return db
    .select()
    .from(testimonials)
    .where(eq(testimonials.isPublished, true))
    .orderBy(asc(testimonials.sortOrder), desc(testimonials.createdAt));
}
