"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, ShoppingBag, Check } from "lucide-react";
import { formatRupees, calculatePercentSavings } from "@/lib/utils/money";
import { useCartStore } from "@/lib/cart/store";

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    shortDescription?: string | null;
    basePricePaise: number;
    salePricePaise?: number | null;
    rating?: number;
    reviewCount?: number;
    badge?: string | null;
    flowType?: string | null;
    image?: string | null;
    defaultVariant?: {
      id: string;
      name: string;
      sku: string;
      pricePaise: number;
      salePricePaise?: number | null;
      stock: number;
    } | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);

  const pricePaise = product.defaultVariant?.pricePaise ?? product.basePricePaise;
  const salePricePaise = product.defaultVariant?.salePricePaise ?? product.salePricePaise;
  const currentPrice = salePricePaise ?? pricePaise;
  const hasDiscount = salePricePaise && salePricePaise < pricePaise;
  const discountPercent = calculatePercentSavings(pricePaise, salePricePaise);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.defaultVariant) return;

    addItem({
      variantId: product.defaultVariant.id,
      productId: product.id,
      productName: product.name,
      variantName: product.defaultVariant.name,
      sku: product.defaultVariant.sku,
      image: product.image || "/samaura-logo.png",
      pricePaise: product.defaultVariant.pricePaise,
      salePricePaise: product.defaultVariant.salePricePaise,
      stock: product.defaultVariant.stock,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="card-soft group flex flex-col justify-between h-full overflow-hidden bg-white p-3.5 sm:p-5 relative transition-all duration-300 min-w-0 w-full">
      {/* Top Badges */}
      <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-10 flex flex-col gap-1.5 items-start max-w-[calc(100%-4rem)]">
        {product.badge && (
          <span className="badge-brand text-[10px] tracking-wide uppercase font-bold shadow-xs truncate max-w-full">
            {product.badge}
          </span>
        )}
        {hasDiscount && (
          <span className="bg-blush text-brand border border-pink-light text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
            {discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Product Image */}
      <Link
        href={`/product/${product.slug}`}
        className="block relative w-full aspect-square rounded-2xl overflow-hidden bg-blush/50 mb-3.5 sm:mb-4 border border-pink-light/40 shrink-0"
      >
        <Image
          src={product.image || "/samaura-logo.png"}
          alt={product.name}
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </Link>

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between space-y-3 min-w-0">
        <div className="space-y-1.5 min-w-0">
          {/* Flow Type Tag & Rating (on separate lines on narrow mobile widths) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-xs text-muted min-w-0">
            {product.flowType ? (
              <span className="text-[11px] font-medium text-brand bg-blush px-2 py-0.5 rounded-full border border-pink-light/60 truncate max-w-fit">
                {product.flowType}
              </span>
            ) : (
              <span className="hidden sm:inline-block" />
            )}

            {/* Show rating only when approved reviews exist */}
            {product.reviewCount !== undefined && product.reviewCount > 0 && product.rating ? (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-ink">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-[10px] text-muted">
                  ({product.reviewCount})
                </span>
              </div>
            ) : null}
          </div>

          {/* Product Name */}
          <Link
            href={`/product/${product.slug}`}
            className="block font-heading font-semibold text-sm sm:text-base text-ink group-hover:text-brand transition-colors line-clamp-2 min-w-0"
          >
            {product.name}
          </Link>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-xs text-muted line-clamp-2 leading-relaxed min-w-0">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Pricing & Add Button */}
        <div className="pt-2 border-t border-blush flex items-center justify-between gap-2 min-w-0 mt-auto">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-heading font-bold text-base sm:text-lg text-ink whitespace-nowrap">
                {formatRupees(currentPrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-muted line-through whitespace-nowrap">
                  {formatRupees(pricePaise)}
                </span>
              )}
            </div>
            {product.defaultVariant && (
              <span className="text-[10px] text-muted block truncate">
                {product.defaultVariant.name}
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={!product.defaultVariant || product.defaultVariant.stock <= 0}
            className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 flex items-center justify-center shadow-xs active:scale-95 shrink-0 ${
              added
                ? "bg-success text-white"
                : "bg-blush text-brand hover:bg-brand hover:text-white border border-pink-light"
            }`}
            title="Add to Bag"
            aria-label="Add to Bag"
          >
            {added ? (
              <Check className="w-4 h-4" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
