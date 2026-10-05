import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Samaura Healthcare",
  description: "Privacy and data protection policy for Samaura Healthcare customers.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Last updated: October 2026. Your confidentiality is our priority.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-pink-light shadow-xs space-y-6 text-xs sm:text-sm text-muted leading-relaxed">
          <p>
            At Samaura Healthcare (&quot;Samaura&quot;, &quot;we&quot;, &quot;our&quot;), we respect your personal privacy and understand that personal hygiene is private and sensitive. This Privacy Policy details how we collect, store, and safeguard your personal information.
          </p>

          <h2 className="font-heading font-bold text-base text-ink pt-2">
            1. Information We Collect
          </h2>
          <p>
            When you place an order, we collect your name, shipping address, contact phone number, and email address solely for fulfilling your purchase and sending order notifications. We do not store your complete payment card or UPI numbers on our servers; all payment transactions are processed securely through certified PCI-DSS compliant gateways (Razorpay).
          </p>

          <h2 className="font-heading font-bold text-base text-ink pt-2">
            2. Confidential Packaging & Bank Records
          </h2>
          <p>
            We strictly enforce discreet shipping protocols. Your outer shipping label displays minimal courier routing details and will not disclose the contents of the package.
          </p>

          <h2 className="font-heading font-bold text-base text-ink pt-2">
            3. Data Sharing & Third Parties
          </h2>
          <p>
            We never sell, rent, or trade your personal data to external advertisers. Data is shared exclusively with our logistics courier partners (to deliver your package) and transactional email providers (to deliver receipts).
          </p>

          <h2 className="font-heading font-bold text-base text-ink pt-2">
            4. Contact
          </h2>
          <p>
            For any queries regarding your privacy rights, please reach us at <a href="mailto:privacy@samaura.com" className="text-brand underline">privacy@samaura.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
