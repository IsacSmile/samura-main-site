import { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { renderMarkdownToHtml } from "@/lib/markdown";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About Us | Samaura Healthcare",
  description: "Learn about Samaura's mission for gentle, thoughtful intimate hygiene and breathable comfort.",
};

export default async function AboutPage() {
  const [aboutPage] = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, "about"))
    .limit(1);

  const title = aboutPage?.title || "About Samaura Healthcare";
  const content =
    aboutPage?.content ||
    `## Our Purpose\n\n*(Replace with client content)*\n\nSamaura Healthcare was founded to provide gentle, thoughtfully designed intimate hygiene products that respect sensitive skin and body wellness.\n\n### Core Tenets\n\n- Pure cotton topsheets\n- Chlorine-free core\n- Neutral, discreet packaging`;

  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Our Origin &amp; Commitment</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-ink leading-tight">
            {title}
          </h1>
          <p className="text-xs text-muted">
            Last updated: {aboutPage ? new Date(aboutPage.updatedAt).toLocaleDateString() : "Recent"}
          </p>
        </div>

        {/* Content Rendered from Pages Table */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-pink-light shadow-xs">
          <div
            className="prose prose-sm sm:prose-base max-w-none text-ink leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(content) }}
          />
        </div>

        {/* Action Link */}
        <div className="bg-blush rounded-3xl p-8 border border-pink-light flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-heading font-bold text-lg text-ink">
              Have questions about our materials or care standard?
            </h3>
            <p className="text-xs text-muted mt-1">
              Reach out to our customer care team or explore our product range.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-pink-light bg-white hover:bg-blush text-ink"
            >
              Contact Team
            </Link>
            <Link
              href="/shop"
              className="btn-brand text-xs font-semibold py-2.5 px-5 shadow-xs"
            >
              Shop Catalog <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
