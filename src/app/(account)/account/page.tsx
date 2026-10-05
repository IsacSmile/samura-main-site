import { Metadata } from "next";
import Link from "next/link";
import { Package, MapPin, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "My Account | Samaura Healthcare",
  description: "Manage your profile, order history, and saved shipping addresses.",
};

export default function AccountPage() {
  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-blush">
          <div className="space-y-1">
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink">
              My Account
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              Manage your orders, repeat routine deliveries, and update addresses.
            </p>
          </div>
          <Link href="/shop">
            <Button variant="blush" size="sm">
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Orders Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-light shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blush text-brand flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-ink">
                My Orders
              </h3>
              <p className="text-xs text-muted mt-1">
                View tracking status and past order receipts.
              </p>
            </div>
            <div className="pt-4 border-t border-blush text-xs text-muted">
              No orders placed yet.
            </div>
          </div>

          {/* Saved Addresses */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-light shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blush text-brand flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-ink">
                Saved Addresses
              </h3>
              <p className="text-xs text-muted mt-1">
                Manage delivery addresses for discreet shipping.
              </p>
            </div>
            <div className="pt-4 border-t border-blush text-xs text-muted">
              Default shipping address configured.
            </div>
          </div>

          {/* Privacy & Care */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-light shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blush text-brand flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-ink">
                Privacy Settings
              </h3>
              <p className="text-xs text-muted mt-1">
                All order descriptions masked on credit card and bank statements.
              </p>
            </div>
            <div className="pt-4 border-t border-blush text-xs text-success font-medium">
              ✓ Discreet Packaging Active
            </div>
          </div>
        </div>

        {/* Promo Shop CTA */}
        <div className="bg-blush rounded-3xl p-8 border border-pink-light flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-heading font-bold text-lg text-ink">
              Stock Up for Your Next Cycle
            </h4>
            <p className="text-xs text-muted">
              Enjoy 15% off with coupon code <strong className="text-brand">WELCOME15</strong> on your order.
            </p>
          </div>
          <Link href="/shop">
            <Button size="md" className="shadow-md">
              Browse Products <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
