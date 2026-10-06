import { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowRight, Tag, Percent } from "lucide-react";
import { db } from "@/lib/db";
import { coupons, products, productVariants, productImages } from "@/lib/db/schema";
import { eq, and, or, isNull, gte, desc, asc } from "drizzle-orm";
import { formatPrice } from "@/lib/utils/money";
import { ProductCard } from "@/components/product/ProductCard";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Special Offers & Discounts | Samaura Healthcare",
  description:
    "Explore active promotional coupons and products with discounted sale prices for gentle menstrual care.",
};

export default async function OffersPage() {
  const now = new Date();

  // 1. Fetch active coupons from database
  const activeCoupons = await db
    .select()
    .from(coupons)
    .where(
      and(
        eq(coupons.isActive, true),
        or(isNull(coupons.expiresAt), gte(coupons.expiresAt, now))
      )
    )
    .orderBy(desc(coupons.discountValue));

  // 2. Fetch products that have a sale price
  const allActiveProducts = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true));

  const saleProductsWithDetails = await Promise.all(
    allActiveProducts.map(async (prod) => {
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

      // Check if product or default variant has a sale price
      const hasSale =
        (prod.salePricePaise != null && prod.salePricePaise < prod.basePricePaise) ||
        (defaultVar?.salePricePaise != null &&
          defaultVar.salePricePaise < defaultVar.pricePaise);

      return {
        ...prod,
        image: primaryImg?.url ?? null,
        defaultVariant: defaultVar ?? null,
        hasSale,
      };
    })
  );

  const discountedProducts = saleProductsWithDetails.filter((p) => p.hasSale);

  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Store Savings & Promos</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink">
            Current Offers & Promo Coupons
          </h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed">
            Apply active promotional coupons at checkout or shop curated essentials currently on sale.
          </p>
        </div>

        {/* Active Coupons Section */}
        <div className="space-y-6">
          <div className="border-b border-blush pb-3">
            <h2 className="font-heading font-bold text-xl text-ink flex items-center gap-2">
              <Tag className="w-5 h-5 text-brand" /> Active Coupons
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Copy and enter these codes during checkout to apply discounts.
            </p>
          </div>

          {activeCoupons.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-pink-light text-center text-muted text-sm">
              There are no active public coupons right now. Check back soon for festive specials!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeCoupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-pink-light shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-brand bg-blush px-3 py-1 rounded-full border border-pink-light">
                        {coupon.discountType === "percentage" ? "Percentage Off" : "Fixed Discount"}
                      </span>
                      <Percent className="w-4 h-4 text-brand" />
                    </div>

                    <div>
                      <div className="text-3xl font-heading font-extrabold text-brand">
                        {coupon.discountType === "percentage"
                          ? `${coupon.discountValue}% OFF`
                          : `${formatPrice(coupon.discountValue)} OFF`}
                      </div>
                      <div className="text-xs text-muted mt-1">
                        {coupon.minOrderPaise > 0
                          ? `On orders above ${formatPrice(coupon.minOrderPaise)}`
                          : "No minimum order requirement"}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-blush space-y-2">
                    <div className="flex items-center justify-between bg-blush/60 border border-pink-light/80 rounded-2xl px-4 py-2.5">
                      <span className="text-xs font-mono font-bold tracking-wider text-ink">
                        {coupon.code}
                      </span>
                      <span className="text-[11px] text-brand font-semibold">
                        Coupon Code
                      </span>
                    </div>

                    <div className="text-[10px] text-muted text-center">
                      {coupon.expiresAt
                        ? `Valid until ${new Date(coupon.expiresAt).toLocaleDateString()}`
                        : "Limited time offer"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Discounted Products Section */}
        <div className="space-y-6">
          <div className="border-b border-blush pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-xl text-ink">
                Products On Sale
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Items currently available at special discounted prices.
              </p>
            </div>
            <Link
              href="/shop"
              className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
            >
              Browse All Products <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {discountedProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-pink-light text-center text-muted text-sm">
              All items are currently at their regular pricing. Explore our complete catalogue below.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {discountedProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="bg-blush border border-pink-light rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="font-heading font-bold text-xl sm:text-2xl text-ink">
              Ready for gentle, breathable cycle care?
            </h3>
            <p className="text-xs sm:text-sm text-muted max-w-xl">
              All orders are packed in unmarked, confidential boxes and shipped discreetly across India.
            </p>
          </div>
          <Link
            href="/shop"
            className="btn-brand whitespace-nowrap text-sm font-semibold py-3 px-8 shadow-md"
          >
            Explore Catalog →
          </Link>
        </div>
      </div>
    </div>
  );
}
