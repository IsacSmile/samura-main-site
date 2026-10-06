"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { adminCouponSchema } from "@/lib/validation/schemas";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function upsertCouponAction(input: unknown) {
  await requireAdmin();

  const parsed = adminCouponSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Invalid coupon data",
    };
  }

  const data = parsed.data;
  const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

  try {
    if (data.id) {
      await db
        .update(coupons)
        .set({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minOrderPaise: data.minOrderPaise,
          maxDiscountPaise: data.maxDiscountPaise,
          expiresAt,
          usageLimit: data.usageLimit,
          isActive: data.isActive,
        })
        .where(eq(coupons.id, data.id));

      revalidatePath("/admin/coupons");
      revalidatePath("/offers");
      return { success: true, message: "Coupon updated successfully." };
    } else {
      await db.insert(coupons).values({
        id: `cpn_${nanoid(10)}`,
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderPaise: data.minOrderPaise,
        maxDiscountPaise: data.maxDiscountPaise,
        expiresAt,
        usageLimit: data.usageLimit,
        timesUsed: 0,
        isActive: data.isActive,
      });

      revalidatePath("/admin/coupons");
      revalidatePath("/offers");
      return { success: true, message: "Coupon created successfully." };
    }
  } catch (error) {
    console.error("upsertCouponAction error:", error);
    return { success: false, message: "Failed to save coupon." };
  }
}

export async function deleteCouponAction(id: string) {
  await requireAdmin();

  try {
    await db.delete(coupons).where(eq(coupons.id, id));
    revalidatePath("/admin/coupons");
    revalidatePath("/offers");
    return { success: true, message: "Coupon deleted successfully." };
  } catch (error) {
    console.error("deleteCouponAction error:", error);
    return { success: false, message: "Failed to delete coupon." };
  }
}

export async function toggleCouponActiveAction(id: string, isActive: boolean) {
  await requireAdmin();

  try {
    await db
      .update(coupons)
      .set({ isActive })
      .where(eq(coupons.id, id));

    revalidatePath("/admin/coupons");
    revalidatePath("/offers");
    return {
      success: true,
      message: isActive ? "Coupon activated." : "Coupon deactivated.",
    };
  } catch (error) {
    console.error("toggleCouponActiveAction error:", error);
    return { success: false, message: "Failed to update coupon status." };
  }
}
