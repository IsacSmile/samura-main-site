"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCartStore } from "./store";
import { PricingSummary } from "@/lib/services/pricing";
import { getCartPricingAction } from "@/app/actions/cart";

const EMPTY_PRICING: PricingSummary = {
  isValid: true,
  items: [],
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
    updateQuantity,
    clearCart,
  } = useCartStore();
  const [pricing, setPricing] = useState<PricingSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef<number>(0);

  const refreshPricing = useCallback(async () => {
    if (!items || items.length === 0) {
      setPricing(null);
      setError(null);
      setLoading(false);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const summary = await getCartPricingAction(items, appliedCoupon);
      if (currentRequestId === requestIdRef.current) {
        setPricing(summary);
        if (!summary.isValid) {
          setError(summary.error || "Some items in your cart are unavailable.");
        } else {
          setError(null);
        }
      }
    } catch (err: unknown) {
      if (currentRequestId === requestIdRef.current) {
        setError(err instanceof Error ? err.message : "Failed to load pricing.");
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [items, appliedCoupon]);

  useEffect(() => {
    let ignore = false;
    const currentRequestId = ++requestIdRef.current;

    if (!items || items.length === 0) {
      return;
    }

    getCartPricingAction(items, appliedCoupon)
      .then((summary) => {
        if (!ignore && currentRequestId === requestIdRef.current) {
          setPricing(summary);
          setError(summary.isValid ? null : summary.error || "Some items in your cart are unavailable.");
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore && currentRequestId === requestIdRef.current) {
          setError(err instanceof Error ? err.message : "Failed to load pricing.");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [items, appliedCoupon]);

  const applyCoupon = async (code: string): Promise<{ success: boolean; message?: string }> => {
    if (!code.trim()) {
      return { success: false, message: "Please enter a coupon code." };
    }

    setLoading(true);
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
    }
  };

  const effectivePricing = !items || items.length === 0 ? EMPTY_PRICING : pricing ?? EMPTY_PRICING;

  return {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    pricing: effectivePricing,
    loading,
    error,
    refreshPricing,
    applyCoupon,
    removeCoupon,
  };
}
