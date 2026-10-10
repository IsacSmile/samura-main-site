"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCartStore } from "./store";
import { PricingSummary } from "@/lib/services/pricing";
import { getCartPricingAction } from "@/app/actions/cart";

const EMPTY_PRICING: PricingSummary = {
  isValid: true,
  lines: [],
  items: [],
  removed: [],
  adjusted: [],
  itemCount: 0,
  subtotalPaise: 0,
  couponCode: null,
  couponDiscountPaise: 0,
  shippingFeePaise: 0,
  freeShippingThresholdPaise: 49900,
  totalPaise: 0,
  taxNote: "Inclusive of all taxes",
};

export function useCartPricing() {
  const {
    items,
    appliedCoupon,
    setAppliedCoupon,
    removeCoupon,
    removeItem,
    removeItems,
    updateQuantity,
    clearCart,
    setValidItemCount,
    setIsPricingLoading,
    pricingNotice,
    setPricingNotice,
    clearPricingNotice,
    pricingError,
    setPricingError,
  } = useCartStore();

  const [pricing, setPricing] = useState<PricingSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef<number>(0);
  const isPruningRef = useRef<boolean>(false);

  const performPricing = useCallback(
    async (currentItems: typeof items, coupon: string | null) => {
      if (!currentItems || currentItems.length === 0) {
        setPricing(null);
        setError(null);
        setPricingError(null);
        setValidItemCount(0);
        setIsPricingLoading(false);
        setLoading(false);
        return;
      }

      const currentRequestId = ++requestIdRef.current;
      setLoading(true);
      setIsPricingLoading(true);
      setError(null);
      setPricingError(null);

      try {
        const summary = await getCartPricingAction(currentItems, coupon);
        if (currentRequestId !== requestIdRef.current) return;

        // Auto-prune removed lines from store
        if (summary.removed && summary.removed.length > 0) {
          isPruningRef.current = true;
          removeItems(summary.removed.map((r) => r.variantId));
        }

        // Auto-update adjusted quantities in store
        if (summary.adjusted && summary.adjusted.length > 0) {
          isPruningRef.current = true;
          for (const adj of summary.adjusted) {
            updateQuantity(adj.variantId, adj.to);
          }
        }

        // Set friendly customer notice
        if (summary.notice) {
          setPricingNotice(summary.notice);
        }

        const validCount = summary.lines
          ? summary.lines.reduce((sum, l) => sum + l.quantity, 0)
          : summary.itemCount;

        setValidItemCount(validCount);
        setPricing(summary);
        setError(null);
        setPricingError(null);
      } catch (err: unknown) {
        if (currentRequestId === requestIdRef.current) {
          console.error("Cart pricing network/server error:", err);
          const friendlyErrMsg = "Unable to update bag pricing. Please check your connection and try again.";
          setError(friendlyErrMsg);
          setPricingError(friendlyErrMsg);
          // Do NOT clear cart on network/server error
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
          setIsPricingLoading(false);
        }
      }
    },
    [removeItems, updateQuantity, setPricingNotice, setValidItemCount, setIsPricingLoading, setPricingError]
  );

  const refreshPricing = useCallback(async () => {
    await performPricing(items, appliedCoupon);
  }, [items, appliedCoupon, performPricing]);

  useEffect(() => {
    if (isPruningRef.current) {
      isPruningRef.current = false;
      return;
    }
    performPricing(items, appliedCoupon);
  }, [items, appliedCoupon, performPricing]);

  const applyCoupon = async (code: string): Promise<{ success: boolean; message?: string }> => {
    if (!code.trim()) {
      return { success: false, message: "Please enter a coupon code." };
    }

    setLoading(true);
    setIsPricingLoading(true);
    try {
      const cleanCode = code.trim().toUpperCase();
      const testPricing = await getCartPricingAction(items, cleanCode);

      if (testPricing.couponError) {
        return { success: false, message: testPricing.couponError };
      }

      if (testPricing.couponDiscountPaise > 0) {
        setAppliedCoupon(cleanCode);
        setPricing(testPricing);
        return {
          success: true,
          message: `Coupon ${cleanCode} applied! Saved ₹${(testPricing.couponDiscountPaise / 100).toFixed(0)}`,
        };
      }

      return { success: false, message: "Coupon is not applicable to current items." };
    } catch {
      return { success: false, message: "Failed to validate coupon." };
    } finally {
      setLoading(false);
      setIsPricingLoading(false);
    }
  };

  const effectivePricing = !items || items.length === 0 ? EMPTY_PRICING : pricing ?? EMPTY_PRICING;

  return {
    items,
    removeItem,
    removeItems,
    updateQuantity,
    clearCart,
    pricing: effectivePricing,
    loading,
    error: pricingError || error,
    notice: pricingNotice,
    clearNotice: clearPricingNotice,
    refreshPricing,
    retryPricing: refreshPricing,
    applyCoupon,
    removeCoupon,
  };
}
