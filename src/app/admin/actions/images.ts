"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { productImages, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { uploadImageFile, storage } from "@/lib/storage";

export async function uploadProductImageAction(formData: FormData) {
  await requireAdmin();

  const file = formData.get("file") as File | null;
  const productId = formData.get("productId") as string | null;

  if (!file || !(file instanceof File)) {
    return { success: false, error: "Please provide a valid file to upload." };
  }

  if (!productId) {
    return { success: false, error: "Product ID is required." };
  }

  try {
    // 1. Storage abstraction performs type (jpg/png/webp) and size (2MB) validation
    const result = await uploadImageFile(file);

    // 2. Determine current images count for sort order
    const currentImages = await db
      .select({ id: productImages.id })
      .from(productImages)
      .where(eq(productImages.productId, productId));

    const isFirst = currentImages.length === 0;
    const newImageId = `img_${productId}_${Date.now()}`;

    const [inserted] = await db
      .insert(productImages)
      .values({
        id: newImageId,
        productId,
        url: result.url,
        alt: `${file.name.replace(/\.[^/.]+$/, "")}`,
        isPrimary: isFirst,
        sortOrder: currentImages.length + 1,
      })
      .returning();

    // Revalidate paths
    const [prod] = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (prod?.slug) {
      revalidatePath(`/product/${prod.slug}`);
    }
    revalidatePath("/shop");
    revalidatePath(`/admin/products/${productId}/edit`);

    return {
      success: true,
      message: "Image uploaded successfully.",
      image: inserted,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload image.";
    return {
      success: false,
      error: message,
    };
  }
}

export async function uploadStandaloneImageAction(formData: FormData) {
  await requireAdmin();

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return { success: false, error: "Please provide a valid file to upload." };
  }

  try {
    const result = await uploadImageFile(file);
    return {
      success: true,
      url: result.url,
      filename: file.name,
      message: "Image uploaded successfully.",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload image.";
    return {
      success: false,
      error: message,
    };
  }
}

export async function setPrimaryImageAction(productId: string, imageId: string) {
  await requireAdmin();

  if (!productId || !imageId) {
    return { success: false, error: "Product ID and Image ID are required." };
  }

  // Reset all images of this product to not primary
  await db
    .update(productImages)
    .set({ isPrimary: false })
    .where(eq(productImages.productId, productId));

  // Set the chosen image to primary
  await db
    .update(productImages)
    .set({ isPrimary: true })
    .where(eq(productImages.id, imageId));

  const [prod] = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (prod?.slug) {
    revalidatePath(`/product/${prod.slug}`);
  }
  revalidatePath("/shop");
  revalidatePath(`/admin/products/${productId}/edit`);

  return {
    success: true,
    message: "Primary thumbnail updated.",
  };
}

export async function deleteProductImageAction(imageId: string) {
  await requireAdmin();

  if (!imageId) {
    return { success: false, error: "Image ID is required." };
  }

  const [img] = await db
    .select()
    .from(productImages)
    .where(eq(productImages.id, imageId))
    .limit(1);

  if (!img) {
    return { success: false, error: "Image record not found." };
  }

  // Delete from disk if local upload
  if (img.url.startsWith("/uploads/")) {
    const filename = img.url.replace("/uploads/", "");
    await storage.delete(filename);
  }

  await db.delete(productImages).where(eq(productImages.id, imageId));

  // If this was primary, set another image as primary
  if (img.isPrimary) {
    const [nextPrimary] = await db
      .select({ id: productImages.id })
      .from(productImages)
      .where(eq(productImages.productId, img.productId))
      .limit(1);

    if (nextPrimary) {
      await db
        .update(productImages)
        .set({ isPrimary: true })
        .where(eq(productImages.id, nextPrimary.id));
    }
  }

  const [prod] = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.id, img.productId))
    .limit(1);

  if (prod?.slug) {
    revalidatePath(`/product/${prod.slug}`);
  }
  revalidatePath("/shop");
  revalidatePath(`/admin/products/${img.productId}/edit`);

  return {
    success: true,
    message: "Image deleted successfully.",
  };
}
