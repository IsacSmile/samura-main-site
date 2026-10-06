import { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { renderMarkdownToHtml } from "@/lib/markdown";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shipping & Returns Policy | Samaura Healthcare",
  description:
    "Discreet delivery coverage across India, shipping timelines, and intimate hygiene returns policy.",
};

export default async function ShippingReturnsPage() {
  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, "shipping-returns"))
    .limit(1);

  const title = page?.title || "Shipping & Returns Policy";
  const content =
    page?.content ||
    `## Shipping Timelines & Coverage\n*(Replace with client content)*\n\n- Orders dispatch within 24 hours (excluding national holidays).\n- Metro deliveries take 2–3 business days; other regions take 4–6 business days.\n\n### Discreet Packaging Standard\nEvery shipment is dispatched in a plain, unmarked box with confidential courier labels and no product disclosures.\n\n### Hygiene & Returns Policy\nDue to hygiene and intimate health standards, opened sanitary items cannot be returned. Replacements are provided for damaged or confirmed defective items.`;

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
