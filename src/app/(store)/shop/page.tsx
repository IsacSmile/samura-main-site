import React from "react";
import type { Metadata } from "next";
import { getShopProducts, type ShopFilterParams } from "@/lib/services/products";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductFilters } from "@/components/product/ProductFilters";
import { Pagination } from "@/components/product/Pagination";
import { ShopEmptyState } from "@/components/product/ShopEmptyState";
import { Sparkles, ShieldCheck } from "lucide-react";

export const revalidate = 60; // ISR cache revalidation

export const metadata: Metadata = {
  title: "Shop All Organic Hygiene Care",
  description:
    "Browse our complete catalog of certified organic cotton sanitary pads, daily panty liners, medical-grade menstrual cups, and pH 3.5 intimate wellness essentials.",
  openGraph: {
    title: "Shop All Organic Hygiene Care | Samaura Healthcare",
    description:
      "Rash-free, certified organic pads, cups & intimate hygiene delivered in 100% discreet packaging across India.",
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

  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>100% GOTS Certified Organic • Dermatologist Tested</span>
          </div>

          <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-ink tracking-tight">
            {activeCategory ? activeCategory.name : "Shop All Hygiene Care"}
          </h1>

          <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
            {activeCategory?.description ||
              "Thoughtfully engineered feminine hygiene essentials designed for supreme comfort, rash-free days, and uninterrupted sleep. Free discreet delivery on orders above ₹499."}
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

        {/* Discreet Delivery Trust Banner */}
        <div className="mt-16 rounded-3xl bg-blush border border-pink-light p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-brand font-semibold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>100% Confidential &amp; Discreet Packaging</span>
            </div>
            <p className="text-xs text-muted max-w-xl">
              All Samaura shipments are delivered in completely plain exterior cardboard boxes with no product description, logo stamps, or mentions of feminine hygiene on the outside.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-white text-xs font-bold text-ink border border-pink-light">
              Pan-India Delivery
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 border border-emerald-200">
              COD Available
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
