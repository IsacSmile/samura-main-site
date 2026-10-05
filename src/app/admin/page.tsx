import Link from "next/link";
import { db } from "@/db";
import { products, productVariants, categories, reviews } from "@/db/schema";
import { eq, sql, and, lte, gt } from "drizzle-orm";
import { getAdminDashboardMetrics } from "@/lib/services/orders";
import { formatRupees } from "@/lib/utils/money";
import {
  Package,
  AlertTriangle,
  MessageSquare,
  Layers,
  ArrowRight,
  Plus,
  Eye,
  ShoppingBag,
  TrendingUp,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function AdminDashboardPage() {
  // Query aggregate metrics concurrently
  const [
    [totalProductsResult],
    [activeProductsResult],
    [categoriesResult],
    [pendingReviewsResult],
    [lowStockResult],
    [outOfStockResult],
    orderMetrics,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(products),
    db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isActive, true)),
    db.select({ count: sql<number>`count(*)` }).from(categories),
    db.select({ count: sql<number>`count(*)` }).from(reviews).where(eq(reviews.status, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(productVariants).where(and(lte(productVariants.stock, 10), gt(productVariants.stock, 0))),
    db.select({ count: sql<number>`count(*)` }).from(productVariants).where(eq(productVariants.stock, 0)),
    getAdminDashboardMetrics(),
  ]);

  const totalProducts = Number(totalProductsResult?.count ?? 0);
  const activeProducts = Number(activeProductsResult?.count ?? 0);
  const totalCategories = Number(categoriesResult?.count ?? 0);
  const pendingReviews = Number(pendingReviewsResult?.count ?? 0);
  const lowStockVariants = Number(lowStockResult?.count ?? 0);
  const outOfStockVariants = Number(outOfStockResult?.count ?? 0);

  return (
    <div className="space-y-8">
      {/* Top Welcome & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-blush">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink">
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Real-time store metrics, customer orders, inventory thresholds, and review moderation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/orders">
            <Button size="sm" className="shadow-xs">
              <ShoppingBag className="w-4 h-4 mr-1.5" /> View Orders
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button variant="blush" size="sm" className="shadow-xs">
              <Plus className="w-4 h-4 mr-1.5" /> Add Product
            </Button>
          </Link>
          <Link href="/shop" target="_blank">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-1.5" /> Live Shop
            </Button>
          </Link>
        </div>
      </div>

      {/* SECTION 1: Orders & Revenue Metrics */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
          <ShoppingBag className="w-4 h-4 text-brand" />
          <span>Orders &amp; Financial Performance</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Orders Today */}
          <div className="bg-white rounded-3xl p-6 border border-pink-light shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Orders Today
              </span>
              <div className="w-9 h-9 rounded-xl bg-blush text-brand flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="font-heading font-extrabold text-3xl text-ink">
                {orderMetrics.ordersToday}
              </div>
              <p className="text-xs text-muted mt-1">New orders since midnight</p>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-3xl p-6 border border-pink-light shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Pending Orders
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="font-heading font-extrabold text-3xl text-ink">
                {orderMetrics.pendingOrders}
              </div>
              <p className="text-xs text-muted mt-1">Awaiting confirmation or dispatch</p>
            </div>
          </div>

          {/* Flagged Paid After Cancel */}
          <div
            className={`rounded-3xl p-6 border shadow-xs space-y-3 transition-colors ${
              orderMetrics.flaggedOrders > 0
                ? "bg-red-50/60 border-red-200"
                : "bg-white border-pink-light"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  orderMetrics.flaggedOrders > 0 ? "text-red-700" : "text-muted"
                }`}
              >
                Flagged for Review
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  orderMetrics.flaggedOrders > 0
                    ? "bg-red-100 text-red-700 animate-pulse"
                    : "bg-blush text-muted"
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div
                className={`font-heading font-extrabold text-3xl ${
                  orderMetrics.flaggedOrders > 0 ? "text-red-700" : "text-ink"
                }`}
              >
                {orderMetrics.flaggedOrders}
              </div>
              <p className="text-xs text-muted mt-1">
                {orderMetrics.flaggedOrders > 0
                  ? "Late payment after cancel (needs refund)"
                  : "All orders clear"}
              </p>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-3xl p-6 border border-pink-light shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Net Revenue
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="font-heading font-extrabold text-2xl text-ink">
                {formatRupees(orderMetrics.totalRevenuePaise)}
              </div>
              <p className="text-xs text-muted mt-1">Paid &amp; delivered orders only</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Catalog & Stock Metrics */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
          <Package className="w-4 h-4 text-brand" />
          <span>Catalog &amp; Inventory Thresholds</span>
        </h2>
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
              <p className="text-xs text-muted mt-1">
                {activeProducts} active on storefront
              </p>
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
              <p className="text-xs text-muted mt-1">Active hygiene collections</p>
            </div>
          </div>

          {/* Pending Reviews */}
          <div className="bg-white rounded-3xl p-6 border border-pink-light shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Pending Reviews
              </span>
              <div className="w-9 h-9 rounded-xl bg-blush text-brand flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="font-heading font-extrabold text-3xl text-ink">
                {pendingReviews}
              </div>
              <p className="text-xs text-muted mt-1">Awaiting moderation</p>
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="bg-white rounded-3xl p-6 border border-pink-light shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Stock Alerts
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
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
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
        {/* Customer Orders */}
        <Link
          href="/admin/orders"
          className="group bg-white rounded-3xl p-6 border border-pink-light shadow-xs hover:shadow-md hover:border-brand/30 transition-all space-y-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-blush text-brand flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-base text-ink group-hover:text-brand transition-colors">
            Customer Orders
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            Manage fulfillment, add courier tracking, process refunds, and view payment logs.
          </p>
          <div className="pt-2 flex items-center text-xs font-semibold text-brand gap-1 group-hover:translate-x-1 transition-transform">
            <span>Open orders queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Manage Products Card */}
        <Link
          href="/admin/products"
          className="group bg-white rounded-3xl p-6 border border-pink-light shadow-xs hover:shadow-md hover:border-brand/30 transition-all space-y-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-blush text-brand flex items-center justify-center group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-base text-ink group-hover:text-brand transition-colors">
            Manage Products &amp; Stock
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
          <h3 className="font-heading font-bold text-base text-ink group-hover:text-brand transition-colors">
            Manage Categories
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            Organize hygiene lines, manage parent-child categories, and configure navigation links.
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
          <h3 className="font-heading font-bold text-base text-ink group-hover:text-brand transition-colors">
            Review Moderation
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            Review genuine customer submissions, verify purchaser authenticity, and moderate storefront ratings.
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
