"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function toggleCustomerStatusAction(userId: string, isActive: boolean) {
  await requireAdmin();

  try {
    await db
      .update(users)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    revalidatePath("/admin/customers");
    return {
      success: true,
      message: isActive ? "Customer account activated." : "Customer account deactivated.",
    };
  } catch (error) {
    console.error("toggleCustomerStatusAction error:", error);
    return {
      success: false,
      message: "Failed to update customer status.",
    };
  }
}
