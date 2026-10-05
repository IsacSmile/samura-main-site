"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useCartStore } from "@/lib/cart/store";
import { formatRupees } from "@/lib/utils/money";

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    getSubtotalPaise,
    getItemCount,
  } = useCartStore();

  const subtotalPaise = getSubtotalPaise();
  const itemCount = getItemCount();

  // Free shipping threshold is ₹499 (49900 paise)
  const FREE_SHIPPING_THRESHOLD_PAISE = 49900;
  const isFreeShipping = subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE;
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotalPaise / FREE_SHIPPING_THRESHOLD_PAISE) * 100)
  );
  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD_PAISE - subtotalPaise
  );

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={closeCart}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-full max-w-[calc(100vw-1rem)] sm:max-w-md bg-white shadow-2xl flex flex-col border-l border-pink-light animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-blush flex items-center justify-between bg-blush/40">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand" />
              <h2 className="font-heading font-semibold text-lg text-ink">
                Your Bag ({itemCount})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-2 rounded-full text-muted hover:bg-white hover:text-brand transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="px-5 py-3 bg-blush border-b border-pink-light/60">
            <div className="flex items-center justify-between text-xs font-medium text-ink mb-1.5">
              {isFreeShipping ? (
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-success" />
                  Yay! You unlocked FREE Discreet Delivery!
                </span>
              ) : (
                <span>
                  Add{" "}
                  <strong className="text-brand">
                    {formatRupees(remainingForFreeShipping)}
                  </strong>{" "}
                  more for FREE Delivery
                </span>
              )}
              <span className="text-[11px] text-muted">{freeShippingProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-pink-light overflow-hidden">
              <div
                className="h-full bg-brand transition-all duration-300 rounded-full"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-full bg-blush flex items-center justify-center text-brand border border-pink-light">
                  <ShoppingBag className="w-10 h-10 opacity-60" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-semibold text-lg text-ink">
                    Your bag is empty
                  </h3>
                  <p className="text-xs text-muted max-w-xs">
                    Treat your intimate skin with gentle, breathable organic care. Explore our bestsellers.
                  </p>
                </div>
                <Link
                  href="/shop"
                  onClick={closeCart}
                  className="btn-brand text-xs font-semibold py-2.5 px-6"
                >
                  Explore Products
                </Link>
              </div>
            ) : (
              items.map((item) => {
                const currentPrice = item.salePricePaise ?? item.pricePaise;
                const hasSale = item.salePricePaise && item.salePricePaise < item.pricePaise;

                return (
                  <div
                    key={item.variantId}
                    className="flex gap-4 p-3.5 rounded-2xl border border-pink-light/70 bg-white hover:border-rose transition-all shadow-xs"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-blush shrink-0 border border-pink-light">
                      <Image
                        src={item.image || "/samaura-logo.png"}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/product/${item.productId}`}
                            onClick={closeCart}
                            className="font-medium text-sm text-ink hover:text-brand transition-colors line-clamp-1"
                          >
                            {item.productName}
                          </Link>
                          <button
                            onClick={() => removeItem(item.variantId)}
                            className="text-muted hover:text-brand transition-colors p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-muted">{item.variantName}</p>
                      </div>

                      {/* Quantity & Price */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center border border-pink-light rounded-full bg-blush/40 px-2 py-0.5">
                          <button
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity - 1)
                            }
                            className="p-1 text-ink hover:text-brand transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-semibold px-2.5 text-ink">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.stock}
                            className="p-1 text-ink hover:text-brand disabled:opacity-30 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-bold text-ink">
                            {formatRupees(currentPrice * item.quantity)}
                          </div>
                          {hasSale && (
                            <div className="text-[10px] text-muted line-through">
                              {formatRupees(item.pricePaise * item.quantity)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-pink-light bg-blush/30 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span>Subtotal</span>
                  <span className="font-semibold text-ink">
                    {formatRupees(subtotalPaise)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Estimated Shipping</span>
                  <span>
                    {isFreeShipping ? (
                      <span className="text-emerald-700 font-semibold">FREE</span>
                    ) : (
                      "Calculated at checkout"
                    )}
                  </span>
                </div>
              </div>

              {/* Discreet delivery badge */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-pink-light text-[11px] text-muted">
                <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                <span>100% Discreet, plain packaging. Zero brand markings on the box.</span>
              </div>

              {/* Checkout Button */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="btn-secondary text-xs font-semibold py-3 text-center"
                >
                  View Full Bag
                </Link>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="btn-brand text-xs font-semibold py-3 text-center flex items-center justify-center gap-1.5"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
