import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ShieldCheck,
  Heart,
  Truck,
  Leaf,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Star,
  Quote,
  ChevronRight,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  categories,
  products,
  productVariants,
  productImages,
  posts,
  reviews,
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { ProductCard } from "@/components/product/ProductCard";
import { CategoryCard } from "@/components/product/CategoryCard";

export const revalidate = 60; // ISR cache for 60 seconds

export default async function HomePage() {
  // 1. Fetch categories
  const allCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(categories.sortOrder);

  // 2. Fetch products with variants and primary images
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .limit(8);

  const productCardsData = await Promise.all(
    allProducts.map(async (prod) => {
      const [defaultVar] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, prod.id))
        .orderBy(desc(productVariants.isDefault), productVariants.sortOrder)
        .limit(1);

      const [primaryImg] = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, prod.id))
        .orderBy(desc(productImages.isPrimary), productImages.sortOrder)
        .limit(1);

      return {
        ...prod,
        image: primaryImg?.url ?? null,
        defaultVariant: defaultVar ?? null,
      };
    })
  );

  // 3. Fetch latest blog articles
  const latestArticles = await db
    .select()
    .from(posts)
    .where(eq(posts.isPublished, true))
    .limit(3);

  // 4. Fetch verified reviews
  const verifiedReviews = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.isVerified, true), eq(reviews.status, "approved")))
    .limit(3);

  return (
    <div className="space-y-16 lg:space-y-24 pb-16">
      {/* --------------------------------------------------------------------- */}
      {/* 1. HERO SECTION */}
      {/* --------------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-linear-to-b from-blush via-blush/70 to-white pt-10 pb-16 lg:pt-16 lg:pb-24">
        {/* Soft decorative background circles */}
        <div className="absolute top-12 -right-10 w-96 h-96 rounded-full bg-pink-light/40 blur-3xl pointer-events-none hidden sm:block" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:left-10 sm:translate-x-0 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-rose/20 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
                <Sparkles className="w-4 h-4 text-brand" />
                <span>Next Generation Organic Female Hygiene</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight leading-[1.15]">
                Pure Gentleness for Your{" "}
                <span className="text-brand relative inline-block">
                  Delicate Days
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-pink-light"
                    viewBox="0 0 100 20"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,15 Q50,0 100,15"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                .
              </h1>

              {/* Body Subtitle */}
              <p className="text-base sm:text-lg text-muted leading-relaxed max-w-xl mx-auto lg:mx-0">
                Say goodbye to plastic chafing and synthetic perfumes. Samaura delivers organic cotton pads and silicone cups designed for gentle, breathable comfort.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/shop"
                  className="btn-brand w-full sm:w-auto text-sm font-semibold py-3.5 px-8 shadow-md flex items-center justify-center gap-2"
                >
                  <span>Shop Best Sellers</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/category/combos"
                  className="btn-secondary w-full sm:w-auto text-sm font-semibold py-3.5 px-7 text-center"
                >
                  Explore Period Kits
                </Link>
              </div>

              {/* Trust Micro-Badges */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-pink-light/60 text-center lg:text-left">
                <div className="flex items-center gap-2.5 justify-center lg:justify-start">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-success shadow-xs">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-ink">
                    100% Organic Topsheet
                  </span>
                </div>

                <div className="flex items-center gap-2.5 justify-center lg:justify-start">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-ink">
                    Anti-Chafing Comfort
                  </span>
                </div>

                <div className="flex items-center gap-2.5 justify-center lg:justify-start">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-ink shadow-xs">
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-ink">
                    100% Discreet Box
                  </span>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-4/5 bg-linear-to-tr from-blush to-pink-light">
                <Image
                  src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1000"
                  alt="Samaura Organic Cotton Pads"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover object-center"
                  priority
                />

                {/* Floating Brand Promise Pill */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-pink-light shadow-lg flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-blush flex items-center justify-center text-brand shrink-0">
                    <Heart className="w-5 h-5 fill-brand" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-ink">
                      Gentle Cotton Comfort
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Breathable and soothing for everyday peace of mind
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 2. CATEGORY SPOTLIGHT */}
      {/* --------------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Tailored Period Care
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-ink">
              Shop by Your Need
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
      {/* 3. BESTSELLERS SHOWCASE */}
      {/* --------------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Loved by Thousands
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-ink">
              Bestselling Essentials
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark transition-colors group"
          >
            <span>Browse Full Catalog</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {productCardsData.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 4. THE SAMAURA DIFFERENCE (COMPARISON TABLE / TRUST) */}
      {/* --------------------------------------------------------------------- */}
      <section className="bg-blush py-16 lg:py-24 border-y border-pink-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Clean & Chemical-Free
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-ink">
              The Samaura Difference
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Why thousands of women have swapped synthetic drugstore pads for Samaura gentle organic care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Commercial pads */}
            <div className="bg-white/80 rounded-3xl p-6 sm:p-8 border border-red-200/60 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-ink">
                    Mass Market Commercial Pads
                  </h3>
                  <span className="text-xs text-muted">Conventional synthetic brands</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-muted">
                <li className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span>Plastic mesh topsheet that traps heat and causes skin friction</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span>Bleached with chlorine dioxins that release harmful by-products</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span>Artificial fragrances used to mask odor that irritate the vulvar pH</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span>Takes over 500 years to decompose in local landfills</span>
                </li>
              </ul>
            </div>

            {/* Samaura pads */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-success shadow-lg space-y-5 relative">
              <div className="absolute -top-3.5 right-6 bg-success text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow-xs">
                Your Health First
              </div>

              <div className="flex items-center gap-3 pb-4 border-b border-blush">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-success flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-ink">
                    Samaura Healthcare
                  </h3>
                  <span className="text-xs text-emerald-700 font-semibold">Organic &amp; Breathable</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-ink">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span className="font-medium">Soft breathable organic cotton topsheet for velvety comfort</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span className="font-medium">Totally chlorine-free (TCF) core with natural plant-derived SAP</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span className="font-medium">Zero artificial perfumes or dyes; respects natural vaginal microbiome</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span className="font-medium">Individually wrapped in biodegradable plant-based matter</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 5. VERIFIED CUSTOMER REVIEWS */}
      {/* --------------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand">
            Real Stories, Real Relief
          </span>
          <h2 className="font-heading font-bold text-3xl text-ink">
            Loved for Pure Comfort
          </h2>
          <p className="text-sm text-muted">
            Read unfiltered feedback from women who made the switch to Samaura.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {verifiedReviews.map((rev) => (
            <div
              key={rev.id}
              className="card-soft p-6 sm:p-7 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <Quote className="w-8 h-8 text-pink-light" />
                <div className="flex items-center gap-1">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
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
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Customer
                  </span>
                </div>
                <span className="text-[10px] text-muted">Pan-India</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 6. PERIOD HEALTH DESK (BLOG HIGHLIGHTS) */}
      {/* --------------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Knowledge & Wellness
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
              className="group card-soft overflow-hidden p-0 flex flex-col justify-between"
            >
              <div className="relative w-full aspect-16/10 bg-blush">
                {article.coverImage && (
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-brand text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-pink-light">
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
                    Read Story →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 7. DISCREET PACKAGING GUARANTEE BANNER */}
      {/* --------------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-linear-to-r from-blush via-white to-blush border border-pink-light p-8 sm:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
              <ShieldCheck className="w-8 h-8 text-brand" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-ink">
                100% Confidential & Discreet Delivery
              </h3>
              <p className="text-sm text-muted max-w-xl">
                Every order arrives in a completely plain brown cardboard box. No mentions of pads, female hygiene, or periods anywhere on the shipping label. Your privacy is sacred.
              </p>
            </div>
          </div>

          <Link
            href="/shop"
            className="btn-brand whitespace-nowrap text-sm font-semibold py-3.5 px-8 shadow-md"
          >
            Start Gentle Care →
          </Link>
        </div>
      </section>
    </div>
  );
}
