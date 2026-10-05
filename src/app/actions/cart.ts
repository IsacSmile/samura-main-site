"use server";

import { computePricing, CartItemInput, PricingSummary } from "@/lib/services/pricing";
import { auth } from "@/lib/auth";

export async function getCartPricingAction(
  items: CartItemInput[],
  couponCode?: string | null
): Promise<PricingSummary> {
  const session = await auth();
  const userId = session?.user?.id;
  return await computePricing({
    items,
    couponCode,
    userId,
  });
}
