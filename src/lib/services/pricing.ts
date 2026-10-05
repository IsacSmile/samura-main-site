import { db } from "@/db";
import { productVariants, products, productImages, coupons, orders } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getActiveShippingRules, getFreeShippingThresholdPaise } from "@/lib/services/settings";

export interface CartItemInput {
  variantId: string;
  quantity: number;
}

export interface PricingLineItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  sku: string;
  size: string | null;
  packQty: number;
  image: string;
  pricePaise: number;
  salePricePaise: number | null;
  effectivePricePaise: number;
  lineTotalPaise: number;
  quantity: number;
  stock: number;
}

export interface ComputePricingParams {
  items: CartItemInput[];
  couponCode?: string | null;
  address?: {
    state?: string;
    postalCode?: string;
  } | null;
  userId?: string | null;
}

export interface PricingSummary {
  isValid: boolean;
  error?: string;
  items: PricingLineItem[];
  itemCount: number;
  subtotalPaise: number;
  couponCode: string | null;
  couponDiscountPaise: number;
  couponError?: string;
  shippingFeePaise: number;
  freeShippingThresholdPaise: number;
  totalPaise: number;
  taxNote: string;
}

/**
 * Server-authoritative pricing function.
 * Single source of truth for Cart, Checkout, and Order Creation.
 * Never accepts client-provided prices. Re-reads variants, stock, coupons, and shipping rules from DB.
 */
export async function computePricing(params: ComputePricingParams): Promise<PricingSummary> {
  const { items: inputItems, couponCode, userId } = params;

  const thresholdPaise = await getFreeShippingThresholdPaise();
  const baseResult: PricingSummary = {
    isValid: true,
    items: [],
    itemCount: 0,
    subtotalPaise: 0,
    couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
    couponDiscountPaise: 0,
    shippingFeePaise: 0,
    freeShippingThresholdPaise: thresholdPaise,
    totalPaise: 0,
    taxNote: "Inclusive of all taxes",
  };

  if (!inputItems || inputItems.length === 0) {
    return baseResult;
  }

  // 1. Validate & load all variants from DB
  const validatedItems: PricingLineItem[] = [];
  let subtotal = 0;
  let totalCount = 0;

  for (const item of inputItems) {
    const qty = Math.floor(Number(item.quantity));
    if (!qty || qty <= 0) {
      return {
        ...baseResult,
        isValid: false,
        error: `Invalid quantity for item ${item.variantId}.`,
      };
    }

    const [v] = await db
      .select({
        variantId: productVariants.id,
        variantName: productVariants.name,
        sku: productVariants.sku,
        size: productVariants.size,
        packQty: productVariants.packQty,
        pricePaise: productVariants.pricePaise,
        salePricePaise: productVariants.salePricePaise,
        stock: productVariants.stock,
        productId: products.id,
        productName: products.name,
        productSlug: products.slug,
        isProductActive: products.isActive,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(productVariants.id, item.variantId))
      .limit(1);

    if (!v || !v.isProductActive) {
      return {
        ...baseResult,
        isValid: false,
        error: `Product or variant (${item.variantId}) is unavailable or inactive.`,
      };
    }

    if (v.stock <= 0) {
      return {
        ...baseResult,
        isValid: false,
        error: `"${v.productName} (${v.variantName})" is currently out of stock.`,
      };
    }

    if (qty > v.stock) {
      return {
        ...baseResult,
        isValid: false,
        error: `Requested quantity (${qty}) for "${v.productName} (${v.variantName})" exceeds available stock (${v.stock}).`,
      };
    }

    // Get primary image
    const [img] = await db
      .select({ url: productImages.url })
      .from(productImages)
      .where(eq(productImages.productId, v.productId))
      .orderBy(desc(productImages.isPrimary))
      .limit(1);

    const effectivePrice = v.salePricePaise !== null && v.salePricePaise !== undefined
      ? v.salePricePaise
      : v.pricePaise;
    const lineTotal = effectivePrice * qty;

    validatedItems.push({
      variantId: v.variantId,
      productId: v.productId,
      productName: v.productName,
      productSlug: v.productSlug,
      variantName: v.variantName,
      sku: v.sku,
      size: v.size,
      packQty: v.packQty,
      image: img?.url || "/samaura-logo.png",
      pricePaise: v.pricePaise,
      salePricePaise: v.salePricePaise,
      effectivePricePaise: effectivePrice,
      lineTotalPaise: lineTotal,
      quantity: qty,
      stock: v.stock,
    });

    subtotal += lineTotal;
    totalCount += qty;
  }

  // 2. Validate Coupon server-side
  let couponDiscount = 0;
  let couponErr: string | undefined;

  if (couponCode && couponCode.trim()) {
    const cleanCode = couponCode.trim().toUpperCase();
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(
        and(
          sql`UPPER(${coupons.code}) = ${cleanCode}`,
          eq(coupons.isActive, true)
        )
      )
      .limit(1);

    if (!coupon) {
      couponErr = "Coupon code not found or is no longer active.";
    } else if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
      couponErr = "This coupon code has expired.";
    } else if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
      couponErr = "This coupon has reached its maximum usage limit.";
    } else if (subtotal < coupon.minOrderPaise) {
      const minFormatted = (coupon.minOrderPaise / 100).toFixed(0);
      couponErr = `Minimum order amount of ₹${minFormatted} required for this coupon.`;
    } else {
      // Check per-user limit if userId is present
      if (userId) {
        const [userUsage] = await db
          .select({ orderCount: sql<number>`COUNT(*)` })
          .from(orders)
          .where(and(eq(orders.userId, userId), sql`UPPER(${orders.couponCode}) = ${cleanCode}`));

        if (userUsage && Number(userUsage.orderCount) >= 1) {
          couponErr = "You have already used this coupon code.";
        }
      }

      if (!couponErr) {
        if (coupon.discountType === "percentage") {
          couponDiscount = Math.round((subtotal * coupon.discountValue) / 100);
        } else if (coupon.discountType === "fixed_paise") {
          couponDiscount = coupon.discountValue;
        }

        if (coupon.maxDiscountPaise && coupon.maxDiscountPaise > 0) {
          couponDiscount = Math.min(couponDiscount, coupon.maxDiscountPaise);
        }

        // Cap discount at subtotal
        couponDiscount = Math.min(couponDiscount, subtotal);
      }
    }
  }

  // 3. Compute Shipping
  let shippingFee = 0;
  if (subtotal < thresholdPaise) {
    const rules = await getActiveShippingRules();
    const standardRule = rules.find((r) => r.feePaise > 0);
    shippingFee = standardRule ? standardRule.feePaise : 5000; // Default ₹50.00
  }

  const finalTotal = Math.max(0, subtotal - couponDiscount + shippingFee);

  return {
    isValid: true,
    items: validatedItems,
    itemCount: totalCount,
    subtotalPaise: subtotal,
    couponCode: couponDiscount > 0 ? (couponCode ? couponCode.trim().toUpperCase() : null) : null,
    couponDiscountPaise: couponDiscount,
    couponError: couponErr,
    shippingFeePaise: shippingFee,
    freeShippingThresholdPaise: thresholdPaise,
    totalPaise: finalTotal,
    taxNote: "Inclusive of all taxes",
  };
}
