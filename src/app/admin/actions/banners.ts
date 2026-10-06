"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { adminBannerSchema } from "@/lib/validation/schemas";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function upsertBannerAction(input: unknown) {
  await requireAdmin();

  const parsed = adminBannerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Invalid banner data",
    };
  }

  const data = parsed.data;
  const startDate = data.startDate ? new Date(data.startDate) : null;
  const endDate = data.endDate ? new Date(data.endDate) : null;

  try {
    if (data.id) {
      await db
        .update(banners)
        .set({
          title: data.title,
          subtitle: data.subtitle,
          link: data.link,
          imageUrl: data.imageUrl,
          badge: data.badge,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
          startDate,
          endDate,
        })
        .where(eq(banners.id, data.id));

      revalidatePath("/admin/banners");
      revalidatePath("/");
      return { success: true, message: "Banner updated successfully." };
    } else {
      await db.insert(banners).values({
        id: `bnr_${nanoid(10)}`,
        title: data.title,
        subtitle: data.subtitle,
        link: data.link,
        imageUrl: data.imageUrl,
        badge: data.badge,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        startDate,
        endDate,
      });

      revalidatePath("/admin/banners");
      revalidatePath("/");
      return { success: true, message: "Banner created successfully." };
    }
  } catch (error) {
    console.error("upsertBannerAction error:", error);
    return { success: false, message: "Failed to save banner." };
  }
}

export async function deleteBannerAction(id: string) {
  await requireAdmin();

  try {
    await db.delete(banners).where(eq(banners.id, id));
    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { success: true, message: "Banner deleted successfully." };
  } catch (error) {
    console.error("deleteBannerAction error:", error);
    return { success: false, message: "Failed to delete banner." };
  }
}

export async function toggleBannerActiveAction(id: string, isActive: boolean) {
  await requireAdmin();

  try {
    await db
      .update(banners)
      .set({ isActive })
      .where(eq(banners.id, id));

    revalidatePath("/admin/banners");
    revalidatePath("/");
    return {
      success: true,
      message: isActive ? "Banner activated." : "Banner deactivated.",
    };
  } catch (error) {
    console.error("toggleBannerActiveAction error:", error);
    return { success: false, message: "Failed to update banner status." };
  }
}
