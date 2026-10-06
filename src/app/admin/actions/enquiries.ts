"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { enquiries } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function updateEnquiryStatusAction(id: string, status: "new" | "read" | "responded") {
  await requireAdmin();

  try {
    await db
      .update(enquiries)
      .set({ status })
      .where(eq(enquiries.id, id));

    revalidatePath("/admin/enquiries");
    return { success: true, message: `Enquiry marked as ${status}.` };
  } catch (error) {
    console.error("updateEnquiryStatusAction error:", error);
    return { success: false, message: "Failed to update enquiry status." };
  }
}

export async function deleteEnquiryAction(id: string) {
  await requireAdmin();

  try {
    await db.delete(enquiries).where(eq(enquiries.id, id));
    revalidatePath("/admin/enquiries");
    return { success: true, message: "Enquiry deleted successfully." };
  } catch (error) {
    console.error("deleteEnquiryAction error:", error);
    return { success: false, message: "Failed to delete enquiry." };
  }
}
