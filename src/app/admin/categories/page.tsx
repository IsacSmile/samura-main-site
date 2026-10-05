import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { asc, sql } from "drizzle-orm";
import { CategoryManager } from "@/components/admin/CategoryManager";

export default async function AdminCategoriesPage() {
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      parentId: categories.parentId,
      description: categories.description,
      image: categories.image,
      sortOrder: categories.sortOrder,
      isActive: categories.isActive,
      productCount: sql<number>`(SELECT count(*) FROM ${products} WHERE ${products.categoryId} = ${categories.id})`,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder));

  return (
    <div>
      <CategoryManager categories={allCategories} />
    </div>
  );
}
