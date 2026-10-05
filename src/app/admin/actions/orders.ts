"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { updateOrderStatus, OrderStatus } from "@/lib/services/orders";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function updateOrderStatusAdminAction(data: {
  orderId: string;
  nextStatus: OrderStatus;
  courierName?: string;
  trackingNumber?: string;
  refundNotes?: string;
  cancelReason?: string;
}) {
  await requireAdmin();

  const res = await updateOrderStatus(data);

  if (!res.ok) {
    return { success: false, error: res.error };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${data.orderId}`);
  revalidatePath("/admin");

  return { success: true, order: res.order };
}

export async function toggleOrderFlagAdminAction(data: {
  orderId: string;
  isFlagged: boolean;
  flagReason?: string;
}) {
  await requireAdmin();

  await db
    .update(orders)
    .set({
      isFlaggedForReview: data.isFlagged,
      flagReason: data.isFlagged ? data.flagReason || "Flagged by administrator" : null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, data.orderId));

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${data.orderId}`);
  revalidatePath("/admin");

  return { success: true };
}
