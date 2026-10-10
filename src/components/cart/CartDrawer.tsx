"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
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
  Loader2,
  AlertTriangle,
  Info,
  RefreshCw,
} from "lucide-react";
import { useCartStore } from "@/lib/cart/store";
import { useCartPricing } from "@/lib/cart/useCartPricing";
import { formatRupees } from "@/lib/utils/money";
import { EmptyStateIllustration } from "@/components/ui/EmptyStateIllustration";

export function CartDrawer() {
  const pathname = usePathname();
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const validItemCount = useCartStore((s) => s.validItemCount);
  const isPricingLoading = useCartStore((s) => s.isPricingLoading);

  const {
    items,
    pricing,
    loading,
    error,
    notice,
    clearNotice,
    retryPricing,
    removeItem,
    updateQuantity,
  } = useCartPricing();

  const displayItems = pricing?.lines ?? pricing?.items ?? [];
  const isEmpty = items.length === 0 || (!loading && displayItems.length === 0);

  const subtotalPaise = pricing?.subtotalPaise ?? 0;
  const itemCount =
    validItemCount !== null
      ? validItemCount
      : displayItems.reduce((acc, i) => acc + (i.quantity || 0), 0);

  const thresholdPaise = pricing?.freeShippingThresholdPaise ?? 49900;
  const isFreeShipping = subtotalPaise >= thresholdPaise && subtotalPaise > 0;
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotalPaise / thresholdPaise) * 100)
  );
  const remainingForFreeShipping = Math.max(0, thresholdPaise - subtotalPaise);

  // Close on Escape key and lock body scroll
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
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  // Auto-close on route change
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      closeCart();
    }
  }, [pathname, closeCart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-drawer pointer-events-none overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-drawer-backdrop bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in pointer-events-auto"
        onClick={closeCart}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10 pointer-events-none z-drawer">
        <div className="w-full max-w-[calc(100vw-1rem)] sm:max-w-md bg-white shadow-2xl flex flex-col border-l border-pink-light animate-in slide-in-from-right duration-300 pointer-events-auto relative z-drawer">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-blush flex items-center justify-between bg-blush/40">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand" />
              <h2 className="font-heading font-semibold text-lg text-ink flex items-center gap-1.5">
                <span>Your Bag</span>
                <span className="text-muted font-normal text-sm">
                  (
                  {isPricingLoading && items.length > 0 && validItemCount === null ? (
                    <span className="inline-block w-4 h-3.5 bg-pink-light/80 rounded animate-pulse align-middle mx-0.5" />
                  ) : (
                    `${itemCount} ${itemCount === 1 ? "item" : "items"}`
                  )}
                  )
                </span>
              </h2>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-brand ml-1" />}
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="w-11 h-11 min-w-11 min-h-11 flex items-center justify-center rounded-full text-muted hover:bg-white hover:text-brand transition-colors touch-manipulation"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Friendly notice if an item was removed or adjusted */}
          {notice && (
            <div className="mx-4 mt-3 p-3 rounded-2xl bg-blush/70 border border-pink-light flex items-start justify-between gap-2 text-xs text-ink animate-in fade-in">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <span className="leading-snug">{notice}</span>
              </div>
              <button
                onClick={clearNotice}
                className="text-muted hover:text-ink p-0.5 shrink-0"
                aria-label="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Server/Network Error with Retry Button */}
          {error && (
            <div className="mx-4 mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs text-amber-900 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              <button
                onClick={retryPricing}
                className="btn-secondary text-[11px] py-1 px-2.5 shrink-0 flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Content Area */}
          {isEmpty ? (
            /* Empty State ONLY: no progress bar, no delivery fee, no totals */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <EmptyStateIllustration type="cart" className="w-24 h-24 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-heading font-semibold text-lg text-ink">
                  Your bag is empty
                </h3>
                <p className="text-xs text-muted max-w-xs">
                  Explore our reusable menstrual cups and thoughtful gift collections.
                </p>
              </div>
              <Link
                href="/shop"
                onClick={closeCart}
                className="btn-brand text-xs font-semibold py-2.5 px-6 shadow-sm"
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            <>
              {/* Free Shipping Progress Indicator (Only rendered when items exist) */}
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
                {loading && displayItems.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted text-xs">
                      <Loader2 className="w-6 h-6 animate-spin text-brand" />
                      <span>Updating bag pricing...</span>
                    </div>
                  </div>
                ) : (
                  displayItems.map((item) => {
                    const hasSale =
                      item.salePricePaise !== null &&
                      item.salePricePaise < item.pricePaise;

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
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                href={`/product/${item.productSlug}`}
                                onClick={closeCart}
                                className="font-medium text-sm text-ink hover:text-brand transition-colors line-clamp-2"
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

                          {/* Quantity Stepper & Price */}
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
                                disabled={item.quantity >= Math.min(item.stock, 10)}
                                className="p-1 text-ink hover:text-brand disabled:opacity-30 transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-semibold text-ink">
                                {formatRupees(item.lineTotalPaise)}
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
              <div className="p-4 sm:p-5 border-t border-pink-light bg-blush/30 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm text-muted">
                    <span>Subtotal</span>
                    <span className="font-semibold text-ink">
                      {formatRupees(subtotalPaise)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Delivery</span>
                    <span>
                      {isFreeShipping ? (
                        <span className="text-emerald-700 font-semibold">FREE</span>
                      ) : (
                        <span className="text-muted">Calculated at checkout</span>
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted text-right">
                    {pricing?.taxNote || "Inclusive of all taxes"}
                  </p>
                </div>

                {/* Plain packaging badge */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-pink-light text-[11px] text-muted">
                  <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                  <span>Discreet plain packaging. Plain unmarked exterior.</span>
                </div>

                {/* Action Buttons */}
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
                    className="btn-brand text-xs font-semibold py-3 text-center flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <span>Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
