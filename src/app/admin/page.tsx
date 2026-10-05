import Link from "next/link";
import { db } from "@/db";
import { products, productVariants, categories, reviews } from "@/db/schema";
import { eq, sql, and, lte, gt } from "drizzle-orm";
import {
  Package,
  AlertTriangle,
  MessageSquare,
  Layers,
  ArrowRight,
  Plus,
  CheckCircle,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function AdminDashboardPage() {
  // Query aggregate metrics
  const [totalProductsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products);
  const totalProducts = Number(totalProductsResult?.count ?? 0);

  const [activeProductsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.isActive, true));
  const activeProducts = Number(activeProductsResult?.count ?? 0);

  const [categoriesResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(categories);
  const totalCategories = Number(categoriesResult?.count ?? 0);

  const [pendingReviewsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reviews)
    .where(eq(reviews.status, "pending"));
  const pendingReviews = Number(pendingReviewsResult?.count ?? 0);

  const [lowStockResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(productVariants)
    .where(and(lte(productVariants.stock, 10), gt(productVariants.stock, 0)));
  const lowStockVariants = Number(lowStockResult?.count ?? 0);

  const [outOfStockResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(productVariants)
    .where(eq(productVariants.stock, 0));
  const outOfStockVariants = Number(outOfStockResult?.count ?? 0);

  return (
    <div className="space-y-8">
      {/* Top Welcome & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink">
            Catalog Overview
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Real-time catalog metrics, inventory thresholds, and customer moderation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/products/new">
            <Button size="sm" className="shadow-xs">
              <Plus className="w-4 h-4 mr-1.5" /> Add Product
            </Button>
          </Link>
          <Link href="/shop" target="_blank">
            <Button variant="blush" size="sm">
              <Eye className="w-4 h-4 mr-1.5" /> View Live Shop
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Products */}
        <div className="bg-white rounded-3xl p-6 border border-pink-light shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              Total Products
            </span>
            <div className="w-9 h-9 rounded-xl bg-blush text-brand flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-heading font-extrabold text-3xl text-ink">
              {totalProducts}
            </div>
            <div className="text-xs text-muted mt-1 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-success" />
              <span>{activeProducts} published on storefront</span>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-3xl p-6 border border-pink-light shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              Categories
            </span>
            <div className="w-9 h-9 rounded-xl bg-blush text-brand flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-heading font-extrabold text-3xl text-ink">
              {totalCategories}
            </div>
            <div className="text-xs text-muted mt-1">
              Active catalog categories
            </div>
          </div>
        </div>

        {/* Pending Reviews */}
        <div
          className={`rounded-3xl p-6 border shadow-xs space-y-3 transition-colors ${
            pendingReviews > 0
              ? "bg-amber-50/60 border-amber-200"
              : "bg-white border-pink-light"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              Pending Reviews
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                pendingReviews > 0
                  ? "bg-amber-100 text-amber-700"
                  : "bg-blush text-brand"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-heading font-extrabold text-3xl text-ink">
              {pendingReviews}
            </div>
            <div className="text-xs mt-1">
              {pendingReviews > 0 ? (
                <Link
                  href="/admin/reviews"
                  className="text-amber-800 font-semibold underline decoration-dotted flex items-center gap-1"
                >
                  Requires moderation <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <span className="text-muted">Zero pending moderation</span>
              )}
            </div>
          </div>
        </div>

        {/* Inventory Stock Warning */}
        <div
          className={`rounded-3xl p-6 border shadow-xs space-y-3 transition-colors ${
            outOfStockVariants > 0 || lowStockVariants > 0
              ? "bg-rose-50/50 border-rose"
              : "bg-white border-pink-light"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              Stock Alerts
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-heading font-extrabold text-3xl text-ink">
              {lowStockVariants + outOfStockVariants}
            </div>
            <div className="text-xs text-muted mt-1 space-x-2">
              <span className="text-amber-700 font-medium">
                {lowStockVariants} low stock
              </span>
              <span>•</span>
              <span className="text-brand font-medium">
                {outOfStockVariants} out of stock
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Manage Products Card */}
        <Link
          href="/admin/products"
          className="group bg-white rounded-3xl p-6 border border-pink-light shadow-xs hover:shadow-md hover:border-brand/30 transition-all space-y-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-blush text-brand flex items-center justify-center group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-lg text-ink group-hover:text-brand transition-colors">
            Manage Products &amp; Variants
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            Create products, update prices, adjust inventory stock quantities, and upload gallery imagery.
          </p>
          <div className="pt-2 flex items-center text-xs font-semibold text-brand gap-1 group-hover:translate-x-1 transition-transform">
            <span>Open products table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Categories Card */}
        <Link
          href="/admin/categories"
          className="group bg-white rounded-3xl p-6 border border-pink-light shadow-xs hover:shadow-md hover:border-brand/30 transition-all space-y-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-blush text-brand flex items-center justify-center group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-lg text-ink group-hover:text-brand transition-colors">
            Manage Categories
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            Organize catalog hierarchy, customize slugs, set display order, and define subcategory pills.
          </p>
          <div className="pt-2 flex items-center text-xs font-semibold text-brand gap-1 group-hover:translate-x-1 transition-transform">
            <span>Open categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Reviews Moderation Card */}
        <Link
          href="/admin/reviews"
          className="group bg-white rounded-3xl p-6 border border-pink-light shadow-xs hover:shadow-md hover:border-brand/30 transition-all space-y-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-blush text-brand flex items-center justify-center group-hover:scale-105 transition-transform">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-lg text-ink group-hover:text-brand transition-colors">
            Review Moderation Queue
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            Review genuine customer submissions, verify purchaser authenticity, and approve for the storefront.
          </p>
          <div className="pt-2 flex items-center text-xs font-semibold text-brand gap-1 group-hover:translate-x-1 transition-transform">
            <span>Moderate reviews</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
}
