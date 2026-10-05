/**
 * Money and currency helpers.
 * Note: All monetary amounts in Samaura Healthcare are strictly stored and calculated
 * in integer paise (1 Rupee = 100 Paise) to avoid floating-point rounding errors.
 */

export function formatRupees(paise: number): string {
  if (isNaN(paise)) return "₹0";
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(rupees);
}

export const formatPrice = formatRupees;
export const formatPaiseToRupees = formatRupees;

export function paiseToRupees(paise: number): number {
  return Math.round(paise) / 100;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function calculatePercentSavings(basePaise: number, salePaise?: number | null): number {
  if (!salePaise || salePaise >= basePaise || basePaise <= 0) return 0;
  return Math.round(((basePaise - salePaise) / basePaise) * 100);
}

export interface ComputedOrderTotals {
  subtotalPaise: number;
  discountPaise: number;
  shippingFeePaise: number;
  codFeePaise: number;
  totalPaise: number;
  freeShippingQualified: boolean;
  freeShippingRemainingPaise: number;
}

export interface CalculationInput {
  subtotalPaise: number;
  coupon?: {
    discountType: "percentage" | "fixed_paise";
    discountValue: number;
    minOrderPaise: number;
    maxDiscountPaise?: number | null;
  } | null;
  paymentMethod: "razorpay" | "cod";
  freeShippingThresholdPaise?: number; // default ₹499
  flatShippingFeePaise?: number; // default ₹50
  codFeePaise?: number; // default ₹30
}

export function calculateOrderTotals({
  subtotalPaise,
  coupon,
  paymentMethod,
  freeShippingThresholdPaise = 49900,
  flatShippingFeePaise = 5000,
  codFeePaise = 3000,
}: CalculationInput): ComputedOrderTotals {
  // 1. Calculate discount
  let discountPaise = 0;
  if (coupon && subtotalPaise >= coupon.minOrderPaise) {
    if (coupon.discountType === "percentage") {
      discountPaise = Math.round((subtotalPaise * coupon.discountValue) / 100);
      if (coupon.maxDiscountPaise && discountPaise > coupon.maxDiscountPaise) {
        discountPaise = coupon.maxDiscountPaise;
      }
    } else if (coupon.discountType === "fixed_paise") {
      discountPaise = Math.min(coupon.discountValue, subtotalPaise);
    }
  }

  const discountedSubtotal = Math.max(0, subtotalPaise - discountPaise);

  // 2. Shipping calculation
  const freeShippingQualified = discountedSubtotal >= freeShippingThresholdPaise;
  const freeShippingRemainingPaise = Math.max(0, freeShippingThresholdPaise - discountedSubtotal);
  const shippingFeePaise = freeShippingQualified ? 0 : flatShippingFeePaise;

  // 3. COD Fee (only if COD chosen)
  const appliedCodFee = paymentMethod === "cod" ? codFeePaise : 0;

  // 4. Grand Total
  const totalPaise = discountedSubtotal + shippingFeePaise + appliedCodFee;

  return {
    subtotalPaise,
    discountPaise,
    shippingFeePaise,
    codFeePaise: appliedCodFee,
    totalPaise,
    freeShippingQualified,
    freeShippingRemainingPaise,
  };
}
