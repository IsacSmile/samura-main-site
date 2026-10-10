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
    <div className="card-soft group flex flex-col justify-between h-full overflow-hidden bg-white p-3 sm:p-5 relative transition-all duration-300 min-w-0 w-full">
      {/* Top Badge: at most one badge */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex flex-col gap-1.5 items-start max-w-[75%] min-w-0">
        {product.badge ? (
          <span className="badge-brand text-[10px] tracking-wide uppercase font-bold shadow-xs truncate max-w-full">
            {product.badge}
          </span>
        ) : hasDiscount ? (
          <span className="bg-blush text-brand border border-pink-light text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
            {discountPercent}% OFF
          </span>
        ) : null}
      </div>

      {/* Product Image */}
      <Link
        href={`/product/${product.slug}`}
        className="block relative w-full aspect-square rounded-2xl overflow-hidden bg-blush/50 mb-3 sm:mb-4 border border-pink-light/40 shrink-0 min-w-0"
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
      <div className="flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-3 min-w-0">
        <div className="space-y-1.5 min-w-0">
          {/* Flow Type Tag & Rating */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-xs text-muted min-w-0">
            {product.flowType ? (
              <span className="text-[10px] font-medium leading-tight text-ink-muted bg-blush px-2 py-0.5 rounded-full border border-pink-light/60 max-w-fit truncate">
                {product.flowType}
              </span>
            ) : (
              <span className="hidden sm:inline-block" />
            )}

            {/* Show rating only when published reviews exist */}
            {product.reviewCount !== undefined && product.reviewCount > 0 && product.rating ? (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" strokeWidth={1.75} />
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
            className="block font-heading font-medium text-sm sm:text-base text-ink group-hover:text-brand-dark transition-colors line-clamp-2 min-w-0 leading-snug tracking-tight"
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
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap min-w-0">
              <span className="font-heading font-medium text-sm sm:text-lg text-ink whitespace-nowrap tracking-tight">
                {formatRupees(currentPrice)}
              </span>
              {hasDiscount && (
                <span className="text-[11px] sm:text-xs text-muted line-through whitespace-nowrap">
                  {formatRupees(pricePaise)}
                </span>
              )}
            </div>
            {product.defaultVariant && (
              <span className="text-[10px] text-muted block truncate min-w-0">
                {product.defaultVariant.name}
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={!product.defaultVariant || product.defaultVariant.stock <= 0}
            className={`w-11 h-11 min-w-11 min-h-11 rounded-full transition-all duration-200 flex items-center justify-center shadow-xs active:scale-95 shrink-0 ${
              added
                ? "bg-emerald-600 text-white"
                : "bg-blush text-ink hover:bg-brand hover:text-white border border-pink-light"
            }`}
            title="Add to Bag"
            aria-label="Add to Bag"
          >
            {added ? (
              <Check className="w-4 h-4" strokeWidth={2} />
            ) : (
              <ShoppingBag className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
