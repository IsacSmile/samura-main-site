import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/services/products";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ProductVariantSelector } from "@/components/product/ProductVariantSelector";
import { ProductAccordion } from "@/components/product/ProductAccordion";
import { ProductReviews } from "@/components/product/ProductReviews";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { ChevronRight, ShieldCheck, Heart, Leaf, Award } from "lucide-react";
import { calculatePercentSavings } from "@/lib/utils/money";

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const primaryImage = product.images.find((i) => i.isPrimary)?.url || "/products/day-pads.svg";

  return {
    title: `${product.name} | Organic & Rash-Free`,
    description:
      product.shortDescription ||
      `Buy ${product.name} from Samaura Healthcare. 100% GOTS certified organic, rash-free, and delivered in plain discreet packaging.`,
    openGraph: {
      title: `${product.name} | Samaura Healthcare`,
      description: product.shortDescription || undefined,
      url: `/product/${slug}`,
      images: [
        {
          url: primaryImage,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const primaryImage = product.images.find((i) => i.isPrimary)?.url || "/products/day-pads.svg";
  const defaultVar = product.variants.find((v) => v.isDefault) || product.variants[0];
  const pricePaise = defaultVar?.pricePaise ?? product.basePricePaise;
  const salePricePaise = defaultVar?.salePricePaise ?? product.salePricePaise;
  const discountPercent = calculatePercentSavings(pricePaise, salePricePaise);

  // Fetch related products
  const related = await getRelatedProducts(product.id, product.categoryId, 4);

  // Calculate review stats for JSON-LD and display
  const approvedReviews = product.approvedReviews;
  const reviewCount = approvedReviews.length;
  const avgRating =
    reviewCount > 0
      ? (
          approvedReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        ).toFixed(1)
      : null;

  // JSON-LD Product Schema
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://samaura.com";
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: primaryImage.startsWith("http") ? primaryImage : `${siteUrl}${primaryImage}`,
    description: product.shortDescription || product.description,
    sku: defaultVar?.sku || product.slug,
    brand: {
      "@type": "Brand",
      name: "Samaura Healthcare",
    },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/product/${product.slug}`,
      priceCurrency: "INR",
      price: ((salePricePaise ?? pricePaise) / 100).toFixed(2),
      priceValidUntil: "2027-12-31",
      availability:
        product.variants.some((v) => v.stock > 0)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(reviewCount > 0 && avgRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating,
            reviewCount: reviewCount,
          },
        }
      : {}),
  };

  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-6 sm:py-10">
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-14">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-muted flex-wrap"
        >
          <Link href="/" className="hover:text-brand transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/shop" className="hover:text-brand transition-colors">
            Shop
          </Link>
          {product.category && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link
                href={`/category/${product.category.slug}`}
                className="hover:text-brand transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-ink font-semibold truncate max-w-50 sm:max-w-xs">
            {product.name}
          </span>
        </nav>

        {/* Top Product Presentation: Image Gallery (Left) & Purchasing Controls (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Image Gallery with Zoom */}
          <div className="lg:col-span-6 lg:sticky lg:top-28">
            <ProductImageGallery
              images={product.images}
              productName={product.name}
              badge={product.badge}
              discountPercent={discountPercent}
            />
          </div>

          {/* Right Column: Title, Rating, Variant Selector, Actions & Highlights */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              {/* Category tag */}
              {product.category && (
                <Link
                  href={`/category/${product.category.slug}`}
                  className="inline-block text-xs font-bold uppercase tracking-wider text-brand hover:underline"
                >
                  {product.category.name}
                </Link>
              )}

              {/* Product Headline */}
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-ink tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Star Rating & Review Link */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <span>★</span>
                  <span>{avgRating ? avgRating : "4.9"}</span>
                </div>
                <span className="text-muted">•</span>
                <a
                  href="#reviews"
                  className="text-muted hover:text-brand underline decoration-dotted transition-colors"
                >
                  {reviewCount > 0
                    ? `${reviewCount} verified ${reviewCount === 1 ? "review" : "reviews"}`
                    : "No reviews yet (Be first)"}
                </a>
                <span className="text-muted">•</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" /> Certified Safe
                </span>
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <p className="text-xs sm:text-sm text-muted leading-relaxed pt-1">
                  {product.shortDescription}
                </p>
              )}
            </div>

            {/* Key Quality Pillars Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-100 flex items-center gap-1">
                <Leaf className="w-3 h-3 text-success" /> 100% GOTS Cotton
              </span>
              <span className="px-3 py-1 rounded-full bg-blush text-brand text-[11px] font-semibold border border-pink-light flex items-center gap-1">
                <Heart className="w-3 h-3 text-brand" /> Zero Irritation
              </span>
              <span className="px-3 py-1 rounded-full bg-gray-50 text-gray-700 text-[11px] font-semibold border border-gray-200 flex items-center gap-1">
                <Award className="w-3 h-3 text-gray-600" /> Toxin-Free
              </span>
            </div>

            {/* Variant Selector + Dynamic Price + Stock + Quantity Stepper + CTAs */}
            <div className="pt-2">
              <ProductVariantSelector
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  basePricePaise: product.basePricePaise,
                  salePricePaise: product.salePricePaise,
                  image: primaryImage,
                }}
                variants={product.variants}
              />
            </div>
          </div>
        </div>

        {/* Detailed Information Accordion */}
        <section className="pt-8 border-t border-blush max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-ink">
              Product Specifications &amp; Care
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Everything you need to know about material composition, wear instructions, and answers.
            </p>
          </div>

          <ProductAccordion
            ingredients={product.ingredients}
            absorptionGuide={product.absorptionGuide}
            usageGuide={product.usageGuide}
            features={product.features}
            faq={product.faq}
            flowType={product.flowType}
          />
        </section>

        {/* Verified Customer Reviews Section */}
        <section id="reviews" className="pt-12 max-w-4xl mx-auto scroll-mt-28">
          <ProductReviews
            productId={product.id}
            productName={product.name}
            reviews={product.approvedReviews}
          />
        </section>

        {/* Related Products Carousel / Grid */}
        {related.length > 0 && (
          <RelatedProducts
            products={related}
            title="Complete Your Routine"
            subtitle={`Explore other popular care items in ${product.category?.name || "our collection"}`}
          />
        )}
      </div>
    </div>
  );
}
