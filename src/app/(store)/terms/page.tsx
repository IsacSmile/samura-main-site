import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | Samaura Healthcare",
  description: "Terms and conditions governing the use of Samaura Healthcare services and purchases.",
};

export default function TermsPage() {
  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Last updated: October 2026.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-pink-light shadow-xs space-y-6 text-xs sm:text-sm text-muted leading-relaxed">
          <p>
            Welcome to Samaura Healthcare. By accessing our platform or purchasing products, you agree to comply with and be bound by the following terms and conditions.
          </p>

          <h2 className="font-heading font-bold text-base text-ink pt-2">
            1. Medical Disclaimer
          </h2>
          <p>
            The educational content, menstrual guides, and product descriptions provided on Samaura are for informational purposes only and do not substitute for professional medical or gynecological advice. Always consult a qualified physician for persistent pelvic pain or medical conditions.
          </p>

          <h2 className="font-heading font-bold text-base text-ink pt-2">
            2. Orders & Pricing
          </h2>
          <p>
            All prices are quoted in Indian Rupees (₹) inclusive of applicable GST taxes. We reserve the right to cancel or adjust orders in the event of technical typographical errors or inventory discrepancies.
          </p>

          <h2 className="font-heading font-bold text-base text-ink pt-2">
            3. Contact Information
          </h2>
          <p>
            If you have questions regarding these terms, please contact us at <a href="mailto:legal@samaura.com" className="text-brand underline">legal@samaura.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
