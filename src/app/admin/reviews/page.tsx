import { db } from "@/db";
import { reviews, products, productImages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { ReviewModerationTable, ReviewItem } from "@/components/admin/ReviewModerationTable";

export const metadata = {
  title: "Review Moderation | Samaura Admin",
  description: "Moderate, approve, and manage customer product feedback and reviews.",
};

export default async function AdminReviewsPage() {
  await requireAdmin();

  // Query reviews with their product information
  const rawReviews = await db
    .select({
      id: reviews.id,
      productId: reviews.productId,
      productName: products.name,
      productSlug: products.slug,
      userName: reviews.userName,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      status: reviews.status,
      isVerified: reviews.isVerified,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(products, eq(reviews.productId, products.id))
    .orderBy(desc(reviews.createdAt));

  // Fetch primary images for the products
  const productIds = Array.from(new Set(rawReviews.map((r) => r.productId)));
  const images =
    productIds.length > 0
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
          })
          .from(productImages)
          .where(eq(productImages.isPrimary, true))
      : [];

  const imageMap = new Map<string, string>();
  for (const img of images) {
    imageMap.set(img.productId, img.url);
  }

  const formattedReviews: ReviewItem[] = rawReviews.map((r) => ({
    id: r.id,
    productId: r.productId,
    productName: r.productName,
    productSlug: r.productSlug,
    productImage: imageMap.get(r.productId) || null,
    userName: r.userName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    status: r.status,
    isVerified: Boolean(r.isVerified),
    createdAt: r.createdAt,
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-blush pb-5">
        <h1 className="text-2xl font-serif text-ink tracking-tight font-medium">
          Customer Reviews Moderation
        </h1>
        <p className="text-xs text-muted mt-1">
          Review authentic feedback from verified customers, approve genuine testimonials, and moderate submissions before they appear on storefront product pages.
        </p>
      </div>

      <ReviewModerationTable reviews={formattedReviews} />
    </div>
  );
}
