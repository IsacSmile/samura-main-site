import { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { renderMarkdownToHtml } from "@/lib/markdown";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Privacy Policy | Samaura Healthcare",
  description: "Privacy policy, data protection, and confidential order protocols for Samaura Healthcare customers.",
};

export default async function PrivacyPolicyPage() {
  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, "privacy"))
    .limit(1);

  const title = page?.title || "Privacy Policy";
  const content =
    page?.content ||
    `## Privacy & Data Protection\n*(Replace with client content)*\n\n### Information Collection\nWe collect shipping and contact details strictly for order fulfillment.\n\n### Payment Data\nAll card and UPI transactions are handled by PCI-DSS compliant payment gateways. We do not store sensitive payment credentials.\n\n### Packaging Confidentiality\nAll parcels are dispatched in neutral, unmarked packaging with zero mention of hygiene items on the outer label.`;

  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Required Mandatory Legal Review Draft Banner */}
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs font-semibold text-amber-900 flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Draft, review with a legal professional before launch. Replace with client content.</span>
        </div>

        <div className="text-center space-y-3">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Last updated: {page ? new Date(page.updatedAt).toLocaleDateString() : "Recent"}
          </p>
        </div>

        {/* Content Rendered from Pages Table */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-pink-light shadow-xs">
          <div
            className="prose prose-sm max-w-none text-muted leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(content) }}
          />
        </div>
      </div>
    </div>
  );
}
