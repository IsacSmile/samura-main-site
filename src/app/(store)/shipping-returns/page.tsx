import { Metadata } from "next";
import { Package, Truck, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "Shipping & Returns Policy | Samaura Healthcare",
  description: "Discreet shipping timelines, delivery coverage across India, and our hygiene return policy.",
};

export default function ShippingReturnsPage() {
  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink">
            Shipping & Returns Policy
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Reliable, 100% confidential dispatch to over 19,000 pincodes across India.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-pink-light shadow-xs space-y-8 text-sm text-ink leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-ink flex items-center gap-2">
              <Truck className="w-5 h-5 text-brand" /> 1. Shipping Timelines & Rates
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Orders are dispatched within 24 hours of placement (excluding Sundays and national holidays). Metro cities typically receive deliveries within 2–3 business days, while non-metro locations take 4–6 business days.
            </p>
            <p className="text-xs sm:text-sm text-muted">
              We offer <strong>Free Discreet Shipping</strong> on all orders of ₹499 and above. For orders below ₹499, a flat delivery fee of ₹49 is applied at checkout.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-blush">
            <h2 className="font-heading font-bold text-lg text-ink flex items-center gap-2">
              <Package className="w-5 h-5 text-brand" /> 2. 100% Discreet Packaging Guarantee
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              All Samaura shipments are packaged in unmarked, neutral cardboard boxes or opaque recyclable mailers. The shipping label only displays basic courier routing info and our registered entity name; it never mentions &quot;sanitary pads&quot;, &quot;menstrual cups&quot;, or hygiene products.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-blush">
            <h2 className="font-heading font-bold text-lg text-ink flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-brand" /> 3. Hygiene & Return Policy
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              In accordance with intimate health and medical hygiene standards, products once delivered and opened cannot be returned or restocked.
            </p>
            <p className="text-xs sm:text-sm text-muted">
              However, if your order arrives damaged, defective, or incorrect, please notify us within 48 hours of receipt at <a href="mailto:care@samaura.com" className="text-brand font-medium underline">care@samaura.com</a> or via WhatsApp with a photo of the parcel. We will dispatch an immediate replacement at zero extra cost.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
