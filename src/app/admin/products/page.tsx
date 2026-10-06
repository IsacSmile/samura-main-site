import { db } from "@/db";
import { products, categories, productVariants, productImages } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ProductListTable, ProductListItem } from "@/components/admin/ProductListTable";

export default async function AdminProductsPage() {
  const allCategories = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories);

  const rawProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      categoryId: products.categoryId,
      basePricePaise: products.basePricePaise,
      salePricePaise: products.salePricePaise,
      isActive: products.isActive,
      isSample: products.isSample,
      isFeatured: products.isFeatured,
      isBestseller: products.isBestseller,
      updatedAt: products.updatedAt,
      categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .orderBy(desc(products.createdAt));

  // Compute total stocks and variants for each product
  const productsWithStock: ProductListItem[] = await Promise.all(
    rawProducts.map(async (p) => {
      const variants = await db
        .select({ stock: productVariants.stock })
        .from(productVariants)
        .where(eq(productVariants.productId, p.id));

      const [primaryImg] = await db
        .select({ url: productImages.url })
        .from(productImages)
        .where(eq(productImages.productId, p.id))
        .orderBy(desc(productImages.isPrimary), productImages.sortOrder)
        .limit(1);

      const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

      return {
        ...p,
        totalStock,
        variantCount: variants.length,
        primaryImage: primaryImg?.url || "/products/day-pads.svg",
      };
    })
  );

  return (
    <div>
      <ProductListTable
        products={productsWithStock}
        categories={allCategories}
      />
    </div>
  );
}
