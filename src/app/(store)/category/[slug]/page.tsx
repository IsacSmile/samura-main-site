import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getShopProducts,
  getCategoryBySlug,
  type ShopFilterParams,
} from "@/lib/services/products";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductFilters } from "@/components/product/ProductFilters";
import { Pagination } from "@/components/product/Pagination";
import { ShopEmptyState } from "@/components/product/ShopEmptyState";
import { ChevronRight, Sparkles, Tag } from "lucide-react";

export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    flow?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: "newest" | "price_asc" | "price_desc" | "popular";
    q?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: `${category.name} - Organic & Rash-Free`,
    description:
      category.description ||
      `Explore Samaura's certified organic ${category.name}. Thoughtfully made for sensitive skin with zero chemicals.`,
    openGraph: {
      title: `${category.name} | Samaura Healthcare`,
      description: category.description || undefined,
      url: `/category/${slug}`,
      images: category.image ? [{ url: category.image }] : undefined,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const resolvedParams = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const filterParams: ShopFilterParams = {
    category: slug,
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
  } = await getShopProducts(filterParams);

  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-muted"
        >
          <Link href="/" className="hover:text-brand transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/shop" className="hover:text-brand transition-colors">
            Shop
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-ink font-semibold">{category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Category Collection</span>
          </div>

          <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-ink tracking-tight">
            {category.name}
          </h1>

          {category.description && (
            <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
              {category.description}
            </p>
          )}

          {/* Subcategory / Sibling Category Pills */}
          {categories.length > 1 && (
            <div className="pt-2 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                <Tag className="w-3.5 h-3.5 text-brand" /> Browse:
              </span>
              <Link
                href="/shop"
                className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blush text-ink hover:bg-pink-light transition-colors"
              >
                All Care
              </Link>
              {categories.map((c) => {
                const isCurrent = c.slug === slug;
                return (
                  <Link
                    key={c.id}
                    href={`/category/${c.slug}`}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isCurrent
                        ? "bg-brand text-white shadow-xs"
                        : "bg-blush text-ink hover:bg-pink-light"
                    }`}
                  >
                    {c.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Filters, Search & Sort */}
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

            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </>
        ) : (
          <ShopEmptyState
            resetHref={`/category/${slug}`}
            query={resolvedParams.q}
          />
        )}
      </div>
    </div>
  );
}
