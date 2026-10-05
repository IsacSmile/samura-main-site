import { notFound } from "next/navigation";
import { db } from "@/db";
import { products, productVariants, productImages, categories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { ProductForm, InitialProductData } from "@/components/admin/ProductForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const [product] = await db
    .select({ name: products.name })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  return {
    title: product ? `Edit ${product.name} | Samaura Admin` : "Edit Product | Samaura Admin",
  };
}

export default async function AdminEditProductPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;

  // 1. Fetch Product
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) {
    notFound();
  }

  // 2. Fetch Variants
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id))
    .orderBy(asc(productVariants.sortOrder));

  // 3. Fetch Images
  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, id))
    .orderBy(asc(productImages.sortOrder));

  // 4. Fetch Categories
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      parentId: categories.parentId,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  const initialData: InitialProductData = {
    id: product.id,
    categoryId: product.categoryId,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    basePriceRupees: product.basePricePaise / 100,
    salePriceRupees: product.salePricePaise !== null ? product.salePricePaise / 100 : null,
    badge: product.badge,
    flowType: product.flowType,
    ingredients: product.ingredients,
    absorptionGuide: product.absorptionGuide,
    usageGuide: product.usageGuide,
    features: product.features,
    faq: product.faq,
    isFeatured: product.isFeatured,
    isBestseller: product.isBestseller,
    isActive: product.isActive,
    variants: variants.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      size: v.size,
      packQty: v.packQty,
      priceRupees: v.pricePaise / 100,
      salePriceRupees: v.salePricePaise !== null ? v.salePricePaise / 100 : null,
      stock: v.stock,
      isDefault: v.isDefault,
      sortOrder: v.sortOrder,
    })),
    images: images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
  };

  return <ProductForm categories={allCategories} initialData={initialData} />;
}
