import { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { renderMarkdownToHtml } from "@/lib/markdown";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Terms & Conditions | Samaura Healthcare",
  description: "Terms and conditions governing the use of Samaura Healthcare services and purchases.",
};

export default async function TermsPage() {
  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, "terms"))
    .limit(1);

  const title = page?.title || "Terms of Service";
  const content =
    page?.content ||
    `## Terms & Conditions of Use\n*(Replace with client content)*\n\n### 1. General Notice\nBy placing an order on Samaura Healthcare, you agree to these commercial terms.\n\n### 2. Educational & Medical Disclaimer\nGuides and product details are for informational hygiene purposes only and do not replace professional gynecological or medical advice.\n\n### 3. Orders & Pricing\nPrices are quoted in Indian Rupees (₹) inclusive of applicable taxes.`;

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
