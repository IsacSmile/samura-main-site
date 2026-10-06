"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { adminBlogPostSchema } from "@/lib/validation/schemas";
import { checkClaims } from "@/lib/claims/guard";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function upsertPostAction(input: unknown) {
  await requireAdmin();

  const parsed = adminBlogPostSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Invalid post data",
    };
  }

  const data = parsed.data;

  try {
    if (data.id) {
      await db
        .update(posts)
        .set({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          coverImage: data.coverImage,
          author: data.author,
          category: data.category,
          readTime: data.readTime,
          isPublished: data.isPublished,
        })
        .where(eq(posts.id, data.id));

      const claimCheck = checkClaims(data);
      revalidatePath("/admin/blog");
      revalidatePath("/blog");
      revalidatePath(`/blog/${data.slug}`);
      return { success: true, message: "Blog post updated successfully.", warning: claimCheck.warning };
    } else {
      await db.insert(posts).values({
        id: `post_${nanoid(10)}`,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        coverImage: data.coverImage,
        author: data.author,
        category: data.category,
        readTime: data.readTime,
        isPublished: data.isPublished,
        publishedAt: new Date(),
      });

      const claimCheck = checkClaims(data);
      revalidatePath("/admin/blog");
      revalidatePath("/blog");
      revalidatePath(`/blog/${data.slug}`);
      return { success: true, message: "Blog post created successfully.", warning: claimCheck.warning };
    }
  } catch (error) {
    console.error("upsertPostAction error:", error);
    return { success: false, message: "Failed to save blog post. (Slug might be in use)" };
  }
}

export async function deletePostAction(id: string) {
  await requireAdmin();

  try {
    await db.delete(posts).where(eq(posts.id, id));
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    return { success: true, message: "Blog post deleted successfully." };
  } catch (error) {
    console.error("deletePostAction error:", error);
    return { success: false, message: "Failed to delete blog post." };
  }
}

export async function togglePostPublishedAction(id: string, isPublished: boolean) {
  await requireAdmin();

  try {
    await db
      .update(posts)
      .set({ isPublished })
      .where(eq(posts.id, id));

    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    return {
      success: true,
      message: isPublished ? "Blog post published." : "Blog post moved to drafts.",
    };
  } catch (error) {
    console.error("togglePostPublishedAction error:", error);
    return { success: false, message: "Failed to update blog post status." };
  }
}
