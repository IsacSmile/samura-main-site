import { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Shopping Bag | Samaura Healthcare",
  description: "Review your selected female hygiene products, apply coupon codes, and proceed to secure checkout.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink tracking-tight">
            Shopping Bag
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Free discreet shipping across India on orders over ₹499.
          </p>
        </div>

        <CartView />
      </div>
    </div>
  );
}
