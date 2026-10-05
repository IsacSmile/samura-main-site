import { db } from "@/db";
import {
  products,
  categories,
  productVariants,
  productImages,
  reviews,
} from "@/db/schema";
import { eq, and, or, like, gte, lte, desc, asc, sql, count } from "drizzle-orm";

export interface ShopFilterParams {
  category?: string;
  flow?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  sort?: "newest" | "price_asc" | "price_desc" | "popular";
  q?: string;
  page?: string | number;
  limit?: number;
}

export interface ProductWithDetails {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  basePricePaise: number;
  salePricePaise: number | null;
  isFeatured: boolean;
  isBestseller: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  badge: string | null;
  flowType: string | null;
  ingredients: string | null;
  absorptionGuide: string | null;
  usageGuide: string | null;
  features: string | null;
  faq: string | null;
  createdAt: Date;
  updatedAt: Date;
  image: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  defaultVariant?: {
    id: string;
    name: string;
    sku: string;
    size: string | null;
    packQty: number;
    pricePaise: number;
    salePricePaise: number | null;
    stock: number;
    isDefault: boolean;
  } | null;
  variants?: Array<{
    id: string;
    name: string;
    sku: string;
    size: string | null;
    packQty: number;
    pricePaise: number;
    salePricePaise: number | null;
    stock: number;
    isDefault: boolean;
    sortOrder: number;
  }>;
  images?: Array<{
    id: string;
    url: string;
    alt: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }>;
}

export async function getShopProducts(params: ShopFilterParams = {}) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = params.limit ?? 12;
  const offset = (page - 1) * limit;

  // 1. Resolve category if slug is provided
  let targetCategoryId: string | undefined = undefined;
  let activeCategory = null;

  if (params.category && params.category !== "all") {
    const normalizedCatSlug =
      params.category === "intimate-hygiene" || params.category === "wellness"
        ? "intimate-care"
        : params.category === "combos"
        ? "sanitary-pads"
        : params.category;

    const foundCat = await db
      .select()
      .from(categories)
      .where(or(eq(categories.slug, normalizedCatSlug), eq(categories.id, normalizedCatSlug)))
      .limit(1);

    if (foundCat.length > 0) {
      activeCategory = foundCat[0];
      targetCategoryId = activeCategory.id;
    }
  }

  // 2. Build where conditions
  const conditions = [eq(products.isActive, true)];

  if (targetCategoryId) {
    conditions.push(eq(products.categoryId, targetCategoryId));
  }

  if (params.flow && params.flow !== "all") {
    conditions.push(like(products.flowType, `%${params.flow}%`));
  }

  if (params.q && params.q.trim()) {
    const term = `%${params.q.trim()}%`;
    conditions.push(
      or(
        like(products.name, term),
        like(products.shortDescription, term),
        like(products.description, term),
        like(products.ingredients, term)
      )!
    );
  }

  // Convert rupees from URL param into integer paise for strict DB filtering
  if (params.minPrice !== undefined && params.minPrice !== "") {
    const minPaise = Math.round(Number(params.minPrice) * 100);
    if (!isNaN(minPaise) && minPaise > 0) {
      conditions.push(gte(products.basePricePaise, minPaise));
    }
  }

  if (params.maxPrice !== undefined && params.maxPrice !== "") {
    const maxPaise = Math.round(Number(params.maxPrice) * 100);
    if (!isNaN(maxPaise) && maxPaise > 0) {
      conditions.push(lte(products.basePricePaise, maxPaise));
    }
  }

  const whereClause = and(...conditions);

  // 3. Count total matching products
  const countResult = await db
    .select({ total: count() })
    .from(products)
    .where(whereClause);
  const total = countResult[0]?.total ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  // 4. Determine ordering
  let orderByClause = desc(products.createdAt);
  if (params.sort === "price_asc") {
    orderByClause = asc(products.basePricePaise);
  } else if (params.sort === "price_desc") {
    orderByClause = desc(products.basePricePaise);
  } else if (params.sort === "popular") {
    orderByClause = desc(products.isBestseller);
  }

  // 5. Fetch paginated products
  const productRows = await db
    .select()
    .from(products)
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  // 6. Enrich with variants, primary image, and category info
  const items: ProductWithDetails[] = await Promise.all(
    productRows.map(async (prod) => {
      const [defaultVar] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, prod.id))
        .orderBy(desc(productVariants.isDefault), asc(productVariants.sortOrder))
        .limit(1);

      const [primaryImg] = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, prod.id))
        .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder))
        .limit(1);

      const [cat] = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        })
        .from(categories)
        .where(eq(categories.id, prod.categoryId))
        .limit(1);

      const [reviewStats] = await db
        .select({
          avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
          reviewCount: count(),
        })
        .from(reviews)
        .where(and(eq(reviews.productId, prod.id), eq(reviews.status, "approved")));

      return {
        ...prod,
        rating: reviewStats ? Number(reviewStats.avgRating) : 0,
        reviewCount: reviewStats ? Number(reviewStats.reviewCount) : 0,
        image: primaryImg?.url ?? "/products/day-pads.svg",
        category: cat ?? null,
        defaultVariant: defaultVar ?? null,
      };
    })
  );

  // 7. Get all categories for filter sidebar
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
    })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder));

  // 8. Distinct flow types across active products for filter chips
  const flowRows = await db
    .selectDistinct({ flowType: products.flowType })
    .from(products)
    .where(eq(products.isActive, true));

  const allFlowTypes = flowRows
    .map((r) => r.flowType)
    .filter((f): f is string => Boolean(f && f.trim()));

  return {
    products: items,
    total,
    totalPages,
    currentPage: page,
    limit,
    activeCategory,
    categories: allCategories,
    allFlowTypes,
  };
}

export async function getProductBySlug(slug: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);

  if (!product) return null;

  // Fetch category
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, product.categoryId))
    .limit(1);

  // Fetch all variants
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, product.id))
    .orderBy(desc(productVariants.isDefault), asc(productVariants.sortOrder));

  // Fetch all images
  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder));

  // Fetch approved reviews only (never fake data)
  const approvedReviews = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, product.id), eq(reviews.status, "approved")))
    .orderBy(desc(reviews.createdAt));

  return {
    ...product,
    category: category ?? null,
    variants,
    images,
    approvedReviews,
  };
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4
) {
  const relatedRows = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.categoryId, categoryId),
        eq(products.isActive, true),
        sql`${products.id} != ${productId}`
      )
    )
    .limit(limit);

  return Promise.all(
    relatedRows.map(async (prod) => {
      const [defaultVar] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, prod.id))
        .orderBy(desc(productVariants.isDefault), asc(productVariants.sortOrder))
        .limit(1);

      const [primaryImg] = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, prod.id))
        .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder))
        .limit(1);

      const [reviewStats] = await db
        .select({
          avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
          reviewCount: count(),
        })
        .from(reviews)
        .where(and(eq(reviews.productId, prod.id), eq(reviews.status, "approved")));

      return {
        ...prod,
        rating: reviewStats ? Number(reviewStats.avgRating) : 0,
        reviewCount: reviewStats ? Number(reviewStats.reviewCount) : 0,
        image: primaryImg?.url ?? "/products/day-pads.svg",
        defaultVariant: defaultVar ?? null,
      };
    })
  );
}

export async function getCategoryBySlug(slug: string) {
  // Graceful alias mapping for navigation links
  const normalizedSlug =
    slug === "intimate-hygiene" || slug === "wellness"
      ? "intimate-care"
      : slug === "combos"
      ? "sanitary-pads"
      : slug;

  const [category] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, normalizedSlug), eq(categories.isActive, true)))
    .limit(1);

  if (!category) return null;

  // Subcategories if any
  const subcategories = await db
    .select()
    .from(categories)
    .where(and(eq(categories.parentId, category.id), eq(categories.isActive, true)))
    .orderBy(asc(categories.sortOrder));

  return {
    ...category,
    subcategories,
  };
}
