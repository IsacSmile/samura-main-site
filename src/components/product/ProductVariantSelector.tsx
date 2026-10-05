"use client";

import React, { useState } from "react";
import { formatRupees, calculatePercentSavings } from "@/lib/utils/money";
import { useCartStore } from "@/lib/cart/store";
import { Button } from "@/components/ui/Button";
import {
  ShoppingBag,
  Zap,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  Plus,
  Minus,
  Check,
} from "lucide-react";

export interface VariantData {
  id: string;
  name: string;
  sku: string;
  size: string | null;
  packQty: number;
  pricePaise: number;
  salePricePaise: number | null;
  stock: number;
  isDefault: boolean;
  sortOrder: number;
}

export interface ProductVariantSelectorProps {
  product: {
    id: string;
    name: string;
    slug: string;
    basePricePaise: number;
    salePricePaise: number | null;
    image: string | null;
  };
  variants: VariantData[];
}

export function ProductVariantSelector({
  product,
  variants,
}: ProductVariantSelectorProps) {
  // Find default variant or fallback to first
  const defaultVar = variants.find((v) => v.isDefault) || variants[0];
  const [selectedVariant, setSelectedVariant] = useState<VariantData | undefined>(
    defaultVar
  );
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  // Price calculations based on selected variant or base product
  const pricePaise = selectedVariant
    ? selectedVariant.pricePaise
    : product.basePricePaise;
  const salePricePaise = selectedVariant
    ? selectedVariant.salePricePaise
    : product.salePricePaise;
  const currentPrice = salePricePaise ?? pricePaise;
  const hasDiscount = Boolean(salePricePaise && salePricePaise < pricePaise);
  const discountPercent = calculatePercentSavings(pricePaise, salePricePaise);

  const stock = selectedVariant?.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 10;

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > stock) return stock;
      return next;
    });
  };

  const handleAddToCart = () => {
    if (!selectedVariant || isOutOfStock) return;

    addItem(
      {
        variantId: selectedVariant.id,
        productId: product.id,
        productName: product.name,
        variantName: selectedVariant.name,
        sku: selectedVariant.sku,
        image: product.image || "/products/day-pads.svg",
        pricePaise: selectedVariant.pricePaise,
        salePricePaise: selectedVariant.salePricePaise,
        stock: selectedVariant.stock,
      },
      quantity
    );

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const handleBuyNow = () => {
    if (!selectedVariant || isOutOfStock) return;

    addItem(
      {
        variantId: selectedVariant.id,
        productId: product.id,
        productName: product.name,
        variantName: selectedVariant.name,
        sku: selectedVariant.sku,
        image: product.image || "/products/day-pads.svg",
        pricePaise: selectedVariant.pricePaise,
        salePricePaise: selectedVariant.salePricePaise,
        stock: selectedVariant.stock,
      },
      quantity
    );

    // Immediately open drawer to checkout
    openCart();
  };

  return (
    <div className="space-y-6">
      {/* Price & Savings Row */}
      <div className="space-y-2 pb-5 border-b border-blush">
        <div className="flex items-baseline gap-3">
          <span className="font-heading font-extrabold text-3xl sm:text-4xl text-ink">
            {formatRupees(currentPrice)}
          </span>
          {hasDiscount && (
            <span className="text-base sm:text-lg text-muted line-through">
              {formatRupees(pricePaise)}
            </span>
          )}
          {hasDiscount && (
            <span className="bg-blush text-brand border border-pink-light text-xs font-bold px-2.5 py-1 rounded-full shadow-xs">
              Save {discountPercent}%
            </span>
          )}
        </div>
        <p className="text-xs text-muted">
          Inclusive of all taxes. Free 100% discreet delivery on orders above ₹499.
        </p>
      </div>

      {/* Stock Status Badge */}
      <div className="flex items-center gap-2">
        {isOutOfStock ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            Only {stock} items left in stock — order soon!
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            In Stock — Dispatches within 24 Hours
          </span>
        )}
      </div>

      {/* Variant Selector (Size / Pack Quantity) */}
      {variants.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-ink">
              Select Option / Pack Size:
            </label>
            {selectedVariant?.size && (
              <span className="text-xs font-semibold text-brand">
                {selectedVariant.size}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {variants.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id;
              const varPrice = variant.salePricePaise ?? variant.pricePaise;
              const varOutOfStock = variant.stock <= 0;

              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => {
                    setSelectedVariant(variant);
                    setQuantity(1);
                  }}
                  disabled={varOutOfStock}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? "border-brand bg-blush/60 shadow-xs ring-2 ring-brand/15"
                      : "border-pink-light bg-white hover:bg-blush/30 hover:border-rose"
                  } ${varOutOfStock ? "opacity-40 cursor-not-allowed bg-gray-50" : "cursor-pointer"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-ink line-clamp-1">
                      {variant.name}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-pink-light/40">
                    <span className="text-xs font-bold text-ink">
                      {formatRupees(varPrice)}
                    </span>
                    {variant.salePricePaise && (
                      <span className="text-[10px] text-muted line-through">
                        {formatRupees(variant.pricePaise)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity Stepper + CTAs */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-wider text-ink">
            Quantity:
          </span>
          <div className="flex items-center border border-pink-light rounded-full bg-blush/50 p-1">
            <button
              type="button"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1 || isOutOfStock}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-ink hover:text-brand disabled:opacity-40 transition-colors shadow-xs"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center font-heading font-bold text-sm text-ink">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= stock || isOutOfStock}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-ink hover:text-brand disabled:opacity-40 transition-colors shadow-xs"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Buttons: Add to Bag + Buy Now */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Button
            type="button"
            variant={addedAnimation ? "blush" : "primary"}
            size="lg"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-full shadow-pink transition-all active:scale-95"
          >
            {addedAnimation ? (
              <span className="flex items-center gap-2 text-brand font-bold">
                <Check className="w-4 h-4 text-brand" /> Added to Bag!
              </span>
            ) : isOutOfStock ? (
              "Out of Stock"
            ) : (
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Add to Bag
              </span>
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="w-full border-pink-light hover:border-brand transition-all active:scale-95"
          >
            <span className="flex items-center gap-2 text-ink font-semibold">
              <Zap className="w-4 h-4 text-brand" /> Buy Now
            </span>
          </Button>
        </div>
      </div>

      {/* Trust & Delivery Micro Badges */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-blush text-xs text-muted">
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-blush/30 border border-pink-light/50">
          <Truck className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-ink block">Plain Box Delivery</span>
            <span className="text-[11px] text-muted">Zero product labels on outside</span>
          </div>
        </div>
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-blush/30 border border-pink-light/50">
          <ShieldCheck className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-ink block">100% Organic Skin Care</span>
            <span className="text-[11px] text-muted">Certified toxin &amp; rash-free</span>
          </div>
        </div>
      </div>
    </div>
  );
}
