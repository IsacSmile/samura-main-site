import { db } from "@/db";
import { categories } from "@/db/schema";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = {
  title: "New Product | Samaura Admin",
  description: "Create a new product in Samaura catalog",
};

export default async function AdminNewProductPage() {
  await requireAdmin();

  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      parentId: categories.parentId,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return <ProductForm categories={allCategories} />;
}
