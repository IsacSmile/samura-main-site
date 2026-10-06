"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { shippingRules } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { adminShippingRuleSchema } from "@/lib/validation/schemas";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function upsertShippingRuleAction(input: unknown) {
  await requireAdmin();

  const parsed = adminShippingRuleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Invalid shipping rule data",
    };
  }

  const data = parsed.data;

  try {
    if (data.id) {
      await db
        .update(shippingRules)
        .set({
          name: data.name,
          minOrderPaise: data.minOrderPaise,
          maxOrderPaise: data.maxOrderPaise,
          feePaise: data.feePaise,
          isDefault: data.isDefault,
          isActive: data.isActive,
        })
        .where(eq(shippingRules.id, data.id));

      revalidatePath("/admin/shipping");
      revalidatePath("/checkout");
      return { success: true, message: "Shipping rule updated successfully." };
    } else {
      await db.insert(shippingRules).values({
        id: `ship_${nanoid(10)}`,
        name: data.name,
        minOrderPaise: data.minOrderPaise,
        maxOrderPaise: data.maxOrderPaise,
        feePaise: data.feePaise,
        isDefault: data.isDefault,
        isActive: data.isActive,
      });

      revalidatePath("/admin/shipping");
      revalidatePath("/checkout");
      return { success: true, message: "Shipping rule created successfully." };
    }
  } catch (error) {
    console.error("upsertShippingRuleAction error:", error);
    return { success: false, message: "Failed to save shipping rule." };
  }
}

export async function deleteShippingRuleAction(id: string) {
  await requireAdmin();

  try {
    await db.delete(shippingRules).where(eq(shippingRules.id, id));
    revalidatePath("/admin/shipping");
    revalidatePath("/checkout");
    return { success: true, message: "Shipping rule deleted successfully." };
  } catch (error) {
    console.error("deleteShippingRuleAction error:", error);
    return { success: false, message: "Failed to delete shipping rule." };
  }
}
