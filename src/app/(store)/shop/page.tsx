import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getImageProps } from "next/image";
import { getShopProducts, type ShopFilterParams } from "@/lib/services/products";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductFilters } from "@/components/product/ProductFilters";
import { Pagination } from "@/components/product/Pagination";
import { ShopEmptyState } from "@/components/product/ShopEmptyState";
import { Sparkles } from "lucide-react";
import { SHOP_HERO_BANNER_CONFIG } from "@/config/banners";

export const revalidate = 60; // ISR cache revalidation

export const metadata: Metadata = {
  title: "Shop Menstrual Cups & Gift Collections",
  description:
    "Browse Samaura Menstrual Cups and curated gift collections designed for comfort, education, and sustainable menstrual hygiene.",
  openGraph: {
    title: "Shop Menstrual Cups & Gift Collections | Samaura Healthcare",
    description:
      "Samaura Menstrual Cups and curated gift collections designed for comfort, education, and sustainable menstrual hygiene.",
    url: "/shop",
  },
};

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    flow?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: "newest" | "price_asc" | "price_desc" | "popular";
    q?: string;
    page?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const resolvedParams = await searchParams;

  const filterParams: ShopFilterParams = {
    category: resolvedParams.category,
    flow: resolvedParams.flow,
    minPrice: resolvedParams.minPrice,
    maxPrice: resolvedParams.maxPrice,
    sort: resolvedParams.sort,
    q: resolvedParams.q,
    page: resolvedParams.page,
    limit: 12,
  };

  const {
    products,
    total,
    totalPages,
    currentPage,
    categories,
    allFlowTypes,
    activeCategory,
  } = await getShopProducts(filterParams);

  // Shop Hero Banner image props for <picture> art direction
  const commonBannerProps = {
    alt: SHOP_HERO_BANNER_CONFIG.alt,
    sizes: "100vw",
    priority: true,
  };

  const {
    props: { srcSet: desktopBannerSrcSet },
  } = getImageProps({
    ...commonBannerProps,
    width: SHOP_HERO_BANNER_CONFIG.desktop.width,
    height: SHOP_HERO_BANNER_CONFIG.desktop.height,
    src: SHOP_HERO_BANNER_CONFIG.desktop.src,
  });

  const {
    props: { srcSet: mobileBannerSrcSet, ...mobileBannerRest },
  } = getImageProps({
    ...commonBannerProps,
    width: SHOP_HERO_BANNER_CONFIG.mobile.width,
    height: SHOP_HERO_BANNER_CONFIG.mobile.height,
    src: SHOP_HERO_BANNER_CONFIG.mobile.src,
  });

  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen pb-12 sm:pb-16">
      {/* ----------------------------------------------------------------- */}
      {/* HERO BANNER SECTION (FULL WIDTH, 80vh ON DESKTOP) */}
      {/* ----------------------------------------------------------------- */}
      <section
        aria-label="Shop Collection Banner"
        className="w-full shop-hero-banner-height overflow-hidden border-b border-pink-light/60 bg-blush relative"
      >
        <Link
          href="#products-grid"
          aria-label={SHOP_HERO_BANNER_CONFIG.ariaLabel}
          className="block w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 group"
        >
          <picture className="block w-full h-full">
            <source
              media="(min-width: 768px)"
              srcSet={desktopBannerSrcSet}
              width={SHOP_HERO_BANNER_CONFIG.desktop.width}
              height={SHOP_HERO_BANNER_CONFIG.desktop.height}
            />
            <source
              media="(max-width: 767px)"
              srcSet={mobileBannerSrcSet}
              width={SHOP_HERO_BANNER_CONFIG.mobile.width}
              height={SHOP_HERO_BANNER_CONFIG.mobile.height}
            />
            <img
              {...mobileBannerRest}
              fetchPriority="high"
              decoding="async"
              alt={SHOP_HERO_BANNER_CONFIG.alt}
              className="w-full h-full block object-cover object-center transition-transform duration-500 group-hover:scale-[1.01]"
            />
          </picture>
        </Link>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10 pt-6 sm:pt-10">
        {/* Page Header */}
        <div id="products-grid" className="space-y-3 scroll-mt-24">
          <div className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Reusable Menstrual Cups • Thoughtful Gifting</span>
          </div>

          <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-ink tracking-tight">
            {activeCategory ? activeCategory.name : "Shop Menstrual Care"}
          </h1>

          <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
            {activeCategory?.description ||
              "Explore reusable menstrual cups and curated gift collections designed for first-period preparedness and community empowerment."}
          </p>
        </div>

        {/* Product Filters, Search & Sorter */}
        <ProductFilters
          categories={categories}
          allFlowTypes={allFlowTypes}
          totalProducts={total}
        />

        {/* Products Grid or Empty State */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </>
        ) : (
          <ShopEmptyState query={resolvedParams.q} />
        )}
      </div>
    </div>
  );
}
