"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { products, productVariants, productImages } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { adminProductUpsertSchema } from "@/lib/validation/schemas";
import { checkClaims } from "@/lib/claims/guard";

export async function upsertProductAction(input: unknown) {
  await requireAdmin();

  const parsed = adminProductUpsertSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed: " + Object.values(parsed.error.flatten().fieldErrors).flat().join(", "),
    };
  }

  const data = parsed.data;
  const isEditing = Boolean(data.id);
  const productId = data.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // 1. Verify slug uniqueness
  if (isEditing) {
    const duplicate = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.slug, data.slug), ne(products.id, data.id!)))
      .limit(1);

    if (duplicate.length > 0) {
      return {
        success: false,
        error: `Product slug "${data.slug}" is already in use by another product.`,
      };
    }
  } else {
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, data.slug))
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: `Product slug "${data.slug}" already exists. Please choose a unique slug.`,
      };
    }
  }

  // 2. Verify SKU uniqueness across variants
  const skus = data.variants.map((v) => v.sku.trim().toUpperCase());
  const uniqueSkus = new Set(skus);
  if (uniqueSkus.size !== skus.length) {
    return {
      success: false,
      error: "Duplicate SKUs found within product variants. Each variant SKU must be unique.",
    };
  }

  // Convert rupees to integer paise
  const basePricePaise = Math.round(data.basePriceRupees * 100);
  const salePricePaise =
    data.salePriceRupees !== null && data.salePriceRupees !== undefined
      ? Math.round(data.salePriceRupees * 100)
      : null;

  // 3. Upsert Product Row
  if (isEditing) {
    await db
      .update(products)
      .set({
        categoryId: data.categoryId,
        name: data.name.trim(),
        slug: data.slug.trim().toLowerCase(),
        shortDescription: data.shortDescription?.trim() || null,
        description: data.description.trim(),
        basePricePaise,
        salePricePaise,
        badge: data.badge?.trim() || null,
        flowType: data.flowType?.trim() || null,
        ingredients: data.ingredients?.trim() || null,
        absorptionGuide: data.absorptionGuide?.trim() || null,
        usageGuide: data.usageGuide?.trim() || null,
        features: data.features?.trim() || null,
        faq: data.faq?.trim() || null,
        isFeatured: data.isFeatured,
        isBestseller: data.isBestseller,
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(products.id, data.id!));
  } else {
    await db.insert(products).values({
      id: productId,
      categoryId: data.categoryId,
      name: data.name.trim(),
      slug: data.slug.trim().toLowerCase(),
      shortDescription: data.shortDescription?.trim() || null,
      description: data.description.trim(),
      basePricePaise,
      salePricePaise,
      badge: data.badge?.trim() || null,
      flowType: data.flowType?.trim() || null,
      ingredients: data.ingredients?.trim() || null,
      absorptionGuide: data.absorptionGuide?.trim() || null,
      usageGuide: data.usageGuide?.trim() || null,
      features: data.features?.trim() || null,
      faq: data.faq?.trim() || null,
      isFeatured: data.isFeatured,
      isBestseller: data.isBestseller,
      isActive: data.isActive,
    });
  }

  // 4. Update / Recreate Variants
  if (isEditing) {
    await db.delete(productVariants).where(eq(productVariants.productId, productId));
  }

  for (let i = 0; i < data.variants.length; i++) {
    const v = data.variants[i];
    const varPricePaise = Math.round(v.priceRupees * 100);
    const varSalePricePaise =
      v.salePriceRupees !== null && v.salePriceRupees !== undefined
        ? Math.round(v.salePriceRupees * 100)
        : null;

    const variantId = v.id || `var_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;

    await db.insert(productVariants).values({
      id: variantId,
      productId,
      name: v.name.trim(),
      sku: v.sku.trim().toUpperCase(),
      size: v.size?.trim() || null,
      packQty: v.packQty || 1,
      pricePaise: varPricePaise,
      salePricePaise: varSalePricePaise,
      stock: Math.max(0, v.stock),
      isDefault: v.isDefault ?? i === 0,
      sortOrder: v.sortOrder ?? i + 1,
    });
  }

  // 5. Update Images if provided
  if (data.images && data.images.length > 0) {
    await db.delete(productImages).where(eq(productImages.productId, productId));

    for (let i = 0; i < data.images.length; i++) {
      const img = data.images[i];
      const imgId = img.id || `img_${productId}_${i + 1}`;

      await db.insert(productImages).values({
        id: imgId,
        productId,
        url: img.url,
        alt: img.alt || `${data.name} image ${i + 1}`,
        isPrimary: img.isPrimary ?? i === 0,
        sortOrder: img.sortOrder ?? i + 1,
      });
    }
  }

  // Revalidate affected routes
  revalidatePath("/shop");
  revalidatePath("/category/[slug]", "page");
  revalidatePath(`/product/${data.slug}`);
  revalidatePath("/admin/products");
  revalidatePath("/admin");

  const claimCheck = checkClaims(data);

  return {
    success: true,
    message: `Product "${data.name}" ${isEditing ? "updated" : "created"} successfully.`,
    productId,
    slug: data.slug,
    warning: claimCheck.warning,
  };
}

export async function toggleProductStatusAction(id: string) {
  await requireAdmin();

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) {
    return { success: false, error: "Product not found." };
  }

  const newStatus = !product.isActive;

  await db
    .update(products)
    .set({
      isActive: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  revalidatePath("/shop");
  revalidatePath(`/product/${product.slug}`);
  revalidatePath("/admin/products");
  revalidatePath("/admin");

  return {
    success: true,
    message: `Product "${product.name}" is now ${newStatus ? "Published" : "Unpublished"}.`,
  };
}

export async function deleteProductAction(id: string, softDelete = true) {
  await requireAdmin();

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) {
    return { success: false, error: "Product not found." };
  }

  if (softDelete) {
    await db
      .update(products)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));
  } else {
    // Hard delete cascade
    await db.delete(productVariants).where(eq(productVariants.productId, id));
    await db.delete(productImages).where(eq(productImages.productId, id));
    await db.delete(products).where(eq(products.id, id));
  }

  revalidatePath("/shop");
  revalidatePath(`/product/${product.slug}`);
  revalidatePath("/admin/products");
  revalidatePath("/admin");

  return {
    success: true,
    message: `Product "${product.name}" ${softDelete ? "deactivated" : "deleted"} successfully.`,
  };
}
