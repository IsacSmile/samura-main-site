import { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowRight, Percent } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Special Offers & Coupon Codes | Samaura Healthcare",
  description: "Exclusive discounts, bulk pack offers, and coupon codes for certified organic menstrual care.",
};

const OFFERS = [
  {
    code: "WELCOME15",
    discount: "15% OFF",
    title: "Welcome to Samaura",
    description: "Get 15% off on your first purchase of organic cotton pads, panty liners, and wellness essentials.",
    minOrder: "No minimum purchase",
    tag: "First Order Special",
    highlight: true,
  },
  {
    code: "SAMAURA10",
    discount: "10% OFF",
    title: "Eco Hygiene Savings",
    description: "Save 10% on orders above ₹999 across all menstrual cups, sterilizers, and intimate foaming washes.",
    minOrder: "Min order ₹999",
    tag: "Sitewide Coupon",
    highlight: false,
  },
  {
    code: "FREESHIP",
    discount: "FREE SHIPPING",
    title: "Zero Delivery Fee",
    description: "Enjoy complimentary discreet, unmarked delivery to any pincode across India on orders over ₹499.",
    minOrder: "Min order ₹499",
    tag: "Discreet Delivery",
    highlight: false,
  },
];

export default function OffersPage() {
  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Exclusive Savings & Promos</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink">
            Current Offers & Promo Codes
          </h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed">
            Apply these coupon codes at checkout to unlock savings on toxin-free, dermatologist-approved menstrual care.
          </p>
        </div>

        {/* Coupon Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {OFFERS.map((offer) => (
            <div
              key={offer.code}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                offer.highlight
                  ? "bg-white border-2 border-brand shadow-lg relative"
                  : "bg-white border border-pink-light shadow-xs hover:shadow-md"
              }`}
            >
              {offer.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand bg-blush px-3 py-1 rounded-full">
                    {offer.tag}
                  </span>
                  <Percent className="w-4 h-4 text-brand" />
                </div>

                <div>
                  <div className="text-3xl font-heading font-extrabold text-brand">
                    {offer.discount}
                  </div>
                  <h3 className="font-heading font-bold text-lg text-ink mt-1">
                    {offer.title}
                  </h3>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {offer.description}
                </p>
              </div>

              <div className="pt-6 border-t border-blush space-y-4 mt-6">
                <div className="flex items-center justify-between bg-blush/60 border border-pink-light/80 rounded-2xl px-3.5 py-2.5">
                  <div className="text-xs font-mono font-bold tracking-wider text-ink">
                    {offer.code}
                  </div>
                  <span className="text-[11px] text-brand font-medium">Use at checkout</span>
                </div>

                <div className="text-[11px] text-muted text-center">
                  {offer.minOrder}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="bg-blush border border-pink-light rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="font-heading font-bold text-xl sm:text-2xl text-ink">
              Ready to experience rash-free comfort?
            </h3>
            <p className="text-xs sm:text-sm text-muted max-w-xl">
              All orders are packed in 100% plain, unmarked biodegradable boxes for complete confidentiality.
            </p>
          </div>
          <Link href="/shop">
            <Button size="lg" className="shadow-md whitespace-nowrap">
              Shop Catalog Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
