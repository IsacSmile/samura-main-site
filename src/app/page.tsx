import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Star,
  Quote,
  CheckCircle2,
  ArrowRight,
  Package,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  categories,
  products,
  productVariants,
  productImages,
  posts,
  reviews,
  banners,
  pages,
} from "@/lib/db/schema";
import { eq, desc, asc, and, lte, gte, or, isNull } from "drizzle-orm";
import { ProductCard } from "@/components/product/ProductCard";
import { CategoryCard } from "@/components/product/CategoryCard";
import { renderMarkdownToHtml } from "@/lib/markdown";

export const revalidate = 60; // ISR cache for 60 seconds

export default async function HomePage() {
  const now = new Date();

  // 1. Fetch active banners within active window
  const activeBanners = await db
    .select()
    .from(banners)
    .where(
      and(
        eq(banners.isActive, true),
        or(isNull(banners.startDate), lte(banners.startDate, now)),
        or(isNull(banners.endDate), gte(banners.endDate, now))
      )
    )
    .orderBy(asc(banners.sortOrder));

  const heroBanner = activeBanners[0] || null;
  const promoBanners = activeBanners.slice(1);

  // 2. Fetch active categories
  const allCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder));

  // Helper to enrich products with variant and primary image
  const enrichProducts = async (rawProducts: (typeof products.$inferSelect)[]) => {
    return Promise.all(
      rawProducts.map(async (prod) => {
        const [defaultVar] = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, prod.id))
          .orderBy(desc(productVariants.isDefault), asc(productVariants.sortOrder))
          .limit(1);

        const [primaryImg] = await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, prod.id))
          .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder))
          .limit(1);

        return {
          ...prod,
          image: primaryImg?.url ?? null,
          defaultVariant: defaultVar ?? null,
        };
      })
    );
  };

  // 3. Fetch Featured Products
  const rawFeatured = await db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
    .limit(4);
  const featuredProducts = await enrichProducts(rawFeatured);

  // 4. Fetch Bestsellers Products
  const rawBestsellers = await db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.isBestseller, true)))
    .limit(4);
  const bestsellerProducts = await enrichProducts(rawBestsellers);

  // Fallback to recent products if no specific featured/bestsellers tagged
  let displayProducts = featuredProducts;
  if (displayProducts.length === 0) {
    const rawAll = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .limit(8);
    displayProducts = await enrichProducts(rawAll);
  }

  // 5. Fetch "Why Samaura" content from pages table (admin-editable copy)
  const [whySamauraPage] = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, "why-samaura"))
    .limit(1);

  // 6. Fetch published verified customer reviews ONLY (no placeholders or fake ratings)
  const publishedReviews = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.isVerified, true), eq(reviews.status, "published")))
    .limit(3);

  // 7. Fetch published blog posts
  const latestArticles = await db
    .select()
    .from(posts)
    .where(eq(posts.isPublished, true))
    .orderBy(desc(posts.publishedAt))
    .limit(3);

  return (
    <div className="space-y-16 lg:space-y-24 pb-16">
      {/* --------------------------------------------------------------------- */}
      {/* 1. HERO & PROMO BANNER SECTION (FROM BANNERS TABLE) */}
      {/* --------------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-linear-to-b from-blush via-blush/60 to-white pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-pink-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {heroBanner?.badge && (
                <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
                  <Sparkles className="w-3.5 h-3.5 text-brand" />
                  <span>{heroBanner.badge}</span>
                </div>
              )}

              <h1 className="font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl text-ink tracking-tight leading-tight">
                {heroBanner?.title || "Thoughtfully Crafted Intimate Hygiene"}
              </h1>

              <p className="text-muted text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {heroBanner?.subtitle ||
                  "Gentle pure cotton period pads and breathable intimate essentials. Delivered with strictly confidential, plain packaging."}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href={heroBanner?.link || "/shop"}
                  className="btn-brand w-full sm:w-auto text-sm font-semibold py-3.5 px-8 shadow-md flex items-center justify-center gap-2"
                >
                  Explore Collection <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/about"
                  className="w-full sm:w-auto text-xs font-semibold text-ink/80 hover:text-brand px-6 py-3.5 rounded-full border border-pink-light bg-white/80 hover:bg-white text-center transition-all"
                >
                  Why Samaura
                </Link>
              </div>

              {/* Trust Badges Bar */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-6 border-t border-pink-light/70 text-left">
                <div className="flex items-center gap-2 text-ink">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-medium">Soft Pure Cotton</span>
                </div>
                <div className="flex items-center gap-2 text-ink">
                  <ShieldCheck className="w-4 h-4 text-brand shrink-0" />
                  <span className="text-xs font-medium">Discreet Packaging</span>
                </div>
                <div className="flex items-center gap-2 text-ink">
                  <Package className="w-4 h-4 text-brand shrink-0" />
                  <span className="text-xs font-medium">Pan-India Delivery</span>
                </div>
              </div>
            </div>

            {/* Right Banner Image */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md aspect-4/3 sm:aspect-square rounded-3xl overflow-hidden shadow-xl border-2 border-white bg-blush">
                {heroBanner?.imageUrl ? (
                  <Image
                    src={heroBanner.imageUrl}
                    alt={heroBanner.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 500px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-linear-to-br from-blush to-pink-light/40">
                    <Sparkles className="w-12 h-12 text-brand mb-3" />
                    <span className="font-heading font-bold text-lg text-ink">
                      Samaura Healthcare
                    </span>
                    <span className="text-xs text-muted mt-1">
                      Breathable, Chlorine-Free Period Care
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Promo Banners Strip */}
          {promoBanners.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-12">
              {promoBanners.map((promo) => (
                <Link
                  key={promo.id}
                  href={promo.link || "/shop"}
                  className="group bg-white rounded-2xl p-4 border border-pink-light shadow-xs hover:shadow-md transition-all flex items-center gap-4"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-blush shrink-0 border border-pink-light">
                    {promo.imageUrl && (
                      <Image
                        src={promo.imageUrl}
                        alt={promo.title}
                        fill
                        sizes="64px"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {promo.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
                        {promo.badge}
                      </span>
                    )}
                    <h3 className="font-semibold text-xs text-ink truncate group-hover:text-brand transition-colors">
                      {promo.title}
                    </h3>
                    {promo.subtitle && (
                      <p className="text-[11px] text-muted truncate mt-0.5">
                        {promo.subtitle}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 2. CATEGORY TILES (FROM CATEGORIES TABLE) */}
      {/* --------------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Curated Collections
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-ink">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark transition-colors group"
          >
            <span>View All Categories</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {allCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 3. FEATURED & BESTSELLER PRODUCTS (FROM DB) */}
      {/* --------------------------------------------------------------------- */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">
                Editor&apos;s Selection
              </span>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-ink">
                Featured Essentials
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark transition-colors group"
            >
              <span>Explore All</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {bestsellerProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">
                Most Popular
              </span>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-ink">
                Customer Bestsellers
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark transition-colors group"
            >
              <span>Browse Catalog</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestsellerProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 4. WHY SAMAURA (ADMIN-EDITABLE NEUTRAL COPY FROM DB) */}
      {/* --------------------------------------------------------------------- */}
      <section className="bg-blush/50 py-16 lg:py-20 border-y border-pink-light">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Our Principles & Materials
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-ink">
              {whySamauraPage?.title || "Why Samaura"}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-pink-light shadow-xs">
            {whySamauraPage?.content ? (
              <div
                className="prose prose-sm max-w-none text-muted leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdownToHtml(whySamauraPage.content),
                }}
              />
            ) : (
              <div className="text-xs sm:text-sm text-muted leading-relaxed space-y-4">
                <p>
                  Samaura Healthcare focuses on gentle, thoughtfully formulated intimate hygiene products. Our sanitary pads prioritize pure cotton topsheets and breathable plant-based layers.
                </p>
                <p>
                  All products are shipped in neutral, unmarked cardboard boxes to ensure complete discretion and customer confidentiality.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 5. VERIFIED REVIEWS (RENDERED ONLY IF PUBLISHED REVIEWS EXIST IN DB) */}
      {/* --------------------------------------------------------------------- */}
      {publishedReviews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Verified Feedback
            </span>
            <h2 className="font-heading font-bold text-3xl text-ink">
              Customer Experiences
            </h2>
            <p className="text-sm text-muted">
              Unfiltered reviews from verified buyers across India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publishedReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-pink-light shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <Quote className="w-8 h-8 text-pink-light" />
                  <div className="flex items-center gap-1">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-ink leading-relaxed italic">
                    &ldquo;{rev.body}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-blush flex items-center justify-between">
                  <div>
                    <h4 className="font-heading font-semibold text-sm text-ink">
                      {rev.userName}
                    </h4>
                    <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 6. PERIOD HEALTH DESK HIGHLIGHTS (FROM BLOG POSTS) */}
      {/* --------------------------------------------------------------------- */}
      {latestArticles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">
                Hygiene Education
              </span>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-ink">
                From the Period Health Desk
              </h2>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark transition-colors group"
            >
              <span>Read All Articles</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestArticles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="group bg-white rounded-3xl border border-pink-light shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="relative w-full aspect-16/10 bg-blush">
                  {article.coverImage && (
                    <Image
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-brand text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-pink-light">
                    {article.category}
                  </div>
                </div>

                <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-heading font-semibold text-base text-ink group-hover:text-brand transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-blush flex items-center justify-between text-[11px] text-muted">
                    <span>{article.readTime}</span>
                    <span className="text-brand font-semibold flex items-center gap-1">
                      Read Guide →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 7. DISCREET PACKAGING GUARANTEE */}
      {/* --------------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-linear-to-r from-blush via-white to-blush border border-pink-light p-8 sm:p-12 shadow-xs flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
              <ShieldCheck className="w-8 h-8 text-brand" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-ink">
                Strictly Confidential & Discreet Delivery
              </h3>
              <p className="text-sm text-muted max-w-xl">
                Every order arrives in a completely plain brown cardboard box or opaque mailer. No mentions of pads, female hygiene, or periods anywhere on the outer label.
              </p>
            </div>
          </div>

          <Link
            href="/shop"
            className="btn-brand whitespace-nowrap text-sm font-semibold py-3.5 px-8 shadow-md"
          >
            Shop Now →
          </Link>
        </div>
      </section>
    </div>
  );
}
