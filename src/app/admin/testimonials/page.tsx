import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { TestimonialsManager, TestimonialItem } from "@/components/admin/TestimonialsManager";

export const metadata = {
  title: "Customer Testimonials | Samaura Admin",
  description: "Manage homepage customer testimonials, order, and sample flags.",
};

export default async function AdminTestimonialsPage() {
  await requireAdmin();

  const rawTestimonials = await db
    .select()
    .from(testimonials)
    .orderBy(asc(testimonials.sortOrder), desc(testimonials.createdAt));

  const items: TestimonialItem[] = rawTestimonials.map((t) => ({
    id: t.id,
    name: t.name,
    city: t.city,
    rating: t.rating,
    body: t.body,
    isPublished: Boolean(t.isPublished),
    isSample: Boolean(t.isSample),
    sortOrder: t.sortOrder,
    createdAt: t.createdAt,
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-blush pb-5">
        <h1 className="text-2xl font-serif text-ink tracking-tight font-medium">
          Customer Testimonials
        </h1>
        <p className="text-xs text-muted mt-1">
          Curate and display authentic customer feedback for the homepage &ldquo;What Our Customers Say&rdquo; carousel.
        </p>
      </div>

      <TestimonialsManager initialTestimonials={items} />
    </div>
  );
}
