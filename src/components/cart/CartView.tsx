"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Tag,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useCartPricing } from "@/lib/cart/useCartPricing";
import { formatRupees } from "@/lib/utils/money";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyStateIllustration } from "@/components/ui/EmptyStateIllustration";

export function CartView() {
  const {
    items,
    pricing,
    loading,
    error,
    applyCoupon,
    removeCoupon,
    removeItem,
    updateQuantity,
  } = useCartPricing();

  const [couponInput, setCouponInput] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const subtotalPaise = pricing?.subtotalPaise ?? 0;
  const totalPaise = pricing?.totalPaise ?? 0;
  const thresholdPaise = pricing?.freeShippingThresholdPaise ?? 49900;
  const isFreeShipping = subtotalPaise >= thresholdPaise;
  const remainingForFreeShipping = Math.max(0, thresholdPaise - subtotalPaise);
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotalPaise / thresholdPaise) * 100)
  );

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponFeedback(null);
    const res = await applyCoupon(couponInput);
    if (res.success) {
      setCouponFeedback({ type: "success", message: res.message || "Coupon applied!" });
      setCouponInput("");
    } else {
      setCouponFeedback({ type: "error", message: res.message || "Invalid coupon." });
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponFeedback(null);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
        <EmptyStateIllustration type="cart" className="w-28 h-28 mx-auto mb-6" />
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink mb-2">
          Your Shopping Bag is Empty
        </h1>
        <p className="text-sm text-muted max-w-md mb-8 leading-relaxed">
          Looks like you haven&apos;t added any products yet. Discover our pure cotton, breathable daily care.
        </p>
        <Link href="/shop">
          <Button size="lg" className="shadow-md">
            Explore All Products <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  const displayItems = pricing?.items ?? [];

  return (
    <div className="space-y-8">
      {/* Free Shipping Alert Banner */}
      <div className="rounded-3xl bg-blush border border-pink-light p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm font-medium text-ink mb-2">
          {isFreeShipping ? (
            <span className="flex items-center gap-2 text-emerald-700 font-semibold">
              <Sparkles className="w-4 h-4 text-success" />
              You unlocked FREE Discreet Delivery!
            </span>
          ) : (
            <span>
              Add <strong className="text-brand">{formatRupees(remainingForFreeShipping)}</strong> more to get <strong>FREE Discreet Delivery</strong>
            </span>
          )}
          <span className="text-xs text-muted">{freeShippingProgress}% of ₹499</span>
        </div>
        <div className="w-full h-2 rounded-full bg-pink-light overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-300 rounded-full"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      {/* Pricing / Stock Error Notice */}
      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs sm:text-sm text-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Notice regarding your bag</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-pink-light p-4 sm:p-6 shadow-xs divide-y divide-blush">
            {loading && displayItems.length === 0 ? (
              <div className="py-16 text-center text-muted text-sm flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-brand" />
                <span>Fetching server pricing...</span>
              </div>
            ) : (
              displayItems.map((item) => {
                const hasSale =
                  item.salePricePaise !== null &&
                  item.salePricePaise < item.pricePaise;

                return (
                  <div
                    key={item.variantId}
                    className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    {/* Thumbnail + Title */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-blush shrink-0 border border-pink-light">
                        <Image
                          src={item.image || "/samaura-logo.png"}
                          alt={item.productName}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <Link
                          href={`/product/${item.productSlug}`}
                          className="font-heading font-semibold text-sm sm:text-base text-ink hover:text-brand transition-colors line-clamp-2"
                        >
                          {item.productName}
                        </Link>
                        <p className="text-xs text-muted">
                          {item.variantName} {item.size ? `• ${item.size}` : ""}
                        </p>
                        <div className="flex items-center gap-2 sm:hidden pt-1">
                          <span className="text-sm font-bold text-ink">
                            {formatRupees(item.effectivePricePaise)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0">
                      <div className="flex items-center border border-pink-light rounded-full bg-blush/40 px-2 py-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1 text-ink hover:text-brand transition-colors focus:outline-none"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs sm:text-sm font-semibold px-3 text-ink">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="p-1 text-ink hover:text-brand disabled:opacity-30 transition-colors focus:outline-none"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right sm:min-w-24">
                        <div className="text-sm sm:text-base font-bold text-ink">
                          {formatRupees(item.lineTotalPaise)}
                        </div>
                        {hasSale && (
                          <div className="text-xs text-muted line-through">
                            {formatRupees(item.pricePaise * item.quantity)}
                          </div>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId)}
                        className="p-2 text-muted hover:text-brand transition-colors rounded-full hover:bg-blush focus:outline-none"
                        title="Remove product"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-between items-center px-2">
            <Link
              href="/shop"
              className="text-xs sm:text-sm font-medium text-brand hover:underline flex items-center gap-1"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right: Order Summary Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-pink-light p-6 shadow-xs space-y-6">
            <h2 className="font-heading font-bold text-lg text-ink">
              Order Summary
            </h2>

            {/* Subtotal, Shipping, Discount lines */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-muted">
                <span>
                  Subtotal ({pricing?.itemCount ?? items.length}{" "}
                  {(pricing?.itemCount ?? items.length) === 1 ? "item" : "items"})
                </span>
                <span className="font-semibold text-ink">
                  {formatRupees(subtotalPaise)}
                </span>
              </div>

              {pricing?.couponDiscountPaise ? (
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Coupon ({pricing.couponCode})
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      -{formatRupees(pricing.couponDiscountPaise)}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between text-muted">
                <span>Delivery</span>
                <span>
                  {isFreeShipping ? (
                    <span className="text-emerald-700 font-semibold">FREE</span>
                  ) : (
                    formatRupees(pricing?.shippingFeePaise ?? 5000)
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-blush flex items-center justify-between text-base font-bold text-ink">
                <span>Grand Total</span>
                <span className="text-xl text-brand">
                  {formatRupees(totalPaise)}
                </span>
              </div>

              <p className="text-[11px] text-muted text-right">
                {pricing?.taxNote || "Inclusive of all taxes"}
              </p>
            </div>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="space-y-2 pt-2 border-t border-blush">
              <label htmlFor="couponInput" className="block text-xs font-semibold text-ink">
                Have a Promo Code?
              </label>
              <div className="flex gap-2">
                <Input
                  id="couponInput"
                  type="text"
                  placeholder="e.g. WELCOME15"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="uppercase text-xs"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="md"
                  disabled={loading || !couponInput.trim()}
                  className="shrink-0 text-xs"
                >
                  Apply
                </Button>
              </div>

              {couponFeedback && (
                <p
                  className={`text-xs flex items-center gap-1 pt-1 ${
                    couponFeedback.type === "success"
                      ? "text-emerald-700"
                      : "text-red-600"
                  }`}
                >
                  {couponFeedback.type === "success" ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  {couponFeedback.message}
                </p>
              )}
            </form>

            {/* Checkout Button */}
            <Link href="/checkout" className="block pt-2">
              <Button
                size="lg"
                disabled={!pricing?.isValid || items.length === 0}
                className="w-full shadow-md text-sm font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Button>
            </Link>

            {/* Trust Assurance */}
            <div className="space-y-2 pt-4 border-t border-blush text-xs text-muted">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-ink-muted shrink-0" />
                <span>Plain, discreet packaging on all orders</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose shrink-0" />
                <span>Skin-friendly intimate hygiene standard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
