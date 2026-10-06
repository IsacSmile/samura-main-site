"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { adminPageSchema } from "@/lib/validation/schemas";
import { checkClaims } from "@/lib/claims/guard";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function upsertPageAction(input: unknown) {
  await requireAdmin();

  const parsed = adminPageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Invalid page data",
    };
  }

  const data = parsed.data;

  try {
    const existing = await db
      .select()
      .from(pages)
      .where(eq(pages.slug, data.slug))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(pages)
        .set({
          title: data.title,
          content: data.content,
          updatedAt: new Date(),
        })
        .where(eq(pages.slug, data.slug));
    } else {
      await db.insert(pages).values({
        id: `page_${nanoid(10)}`,
        slug: data.slug,
        title: data.title,
        content: data.content,
        updatedAt: new Date(),
      });
    }

    const claimCheck = checkClaims(data);
    revalidatePath("/admin/pages");
    revalidatePath(`/${data.slug}`);
    revalidatePath("/");
    return { success: true, message: `Page "${data.title}" updated successfully.`, warning: claimCheck.warning };
  } catch (error) {
    console.error("upsertPageAction error:", error);
    return { success: false, message: "Failed to save page." };
  }
}
