"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { adminCategorySchema } from "@/lib/validation/schemas";

export async function createCategoryAction(input: unknown) {
  await requireAdmin();

  const parsed = adminCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed: " + Object.values(parsed.error.flatten().fieldErrors).flat().join(", "),
    };
  }

  const { name, slug, parentId, description, image, sortOrder, isActive } = parsed.data;

  // Check slug uniqueness
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    return {
      success: false,
      error: `Category slug "${slug}" already exists. Please choose a unique slug.`,
    };
  }

  const newId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  await db.insert(categories).values({
    id: newId,
    name: name.trim(),
    slug: slug.trim().toLowerCase(),
    parentId: parentId || null,
    description: description?.trim() || null,
    image: image?.trim() || null,
    sortOrder: sortOrder ?? 0,
    isActive: isActive ?? true,
  });

  revalidatePath("/shop");
  revalidatePath("/category/[slug]", "page");
  revalidatePath("/admin/categories");
  revalidatePath("/admin");

  return {
    success: true,
    message: `Category "${name}" created successfully.`,
    categoryId: newId,
  };
}

export async function updateCategoryAction(id: string, input: unknown) {
  await requireAdmin();

  if (!id) {
    return { success: false, error: "Category ID is required." };
  }

  const parsed = adminCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed: " + Object.values(parsed.error.flatten().fieldErrors).flat().join(", "),
    };
  }

  const { name, slug, parentId, description, image, sortOrder, isActive } = parsed.data;

  // Check slug uniqueness excluding self
  const duplicate = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.slug, slug), ne(categories.id, id)))
    .limit(1);

  if (duplicate.length > 0) {
    return {
      success: false,
      error: `Slug "${slug}" is already in use by another category.`,
    };
  }

  // Prevent self-referencing parent
  if (parentId === id) {
    return {
      success: false,
      error: "A category cannot be its own parent category.",
    };
  }

  await db
    .update(categories)
    .set({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      parentId: parentId || null,
      description: description?.trim() || null,
      image: image?.trim() || null,
      sortOrder: sortOrder ?? 0,
      isActive: isActive ?? true,
    })
    .where(eq(categories.id, id));

  revalidatePath("/shop");
  revalidatePath("/category/[slug]", "page");
  revalidatePath(`/category/${slug}`);
  revalidatePath("/admin/categories");
  revalidatePath("/admin");

  return {
    success: true,
    message: `Category "${name}" updated successfully.`,
  };
}

export async function toggleCategoryStatusAction(id: string) {
  await requireAdmin();

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  if (!category) {
    return { success: false, error: "Category not found." };
  }

  const newStatus = !category.isActive;

  await db
    .update(categories)
    .set({
      isActive: newStatus,
    })
    .where(eq(categories.id, id));

  revalidatePath("/shop");
  revalidatePath("/admin/categories");
  revalidatePath("/admin");

  return {
    success: true,
    message: `Category "${category.name}" is now ${newStatus ? "Active" : "Inactive"}.`,
  };
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin();

  // Check if products exist in this category
  const productsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.categoryId, id));

  if (Number(productsCount[0]?.count ?? 0) > 0) {
    return {
      success: false,
      error: `Cannot delete category: ${productsCount[0].count} product(s) are assigned to it. Reassign or delete the products first.`,
    };
  }

  // Check child subcategories
  const childCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(categories)
    .where(eq(categories.parentId, id));

  if (Number(childCount[0]?.count ?? 0) > 0) {
    return {
      success: false,
      error: `Cannot delete category: ${childCount[0].count} child subcategories are linked to it.`,
    };
  }

  await db.delete(categories).where(eq(categories.id, id));

  revalidatePath("/shop");
  revalidatePath("/admin/categories");
  revalidatePath("/admin");

  return {
    success: true,
    message: "Category deleted successfully.",
  };
}
