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
  description:
    "We are a purpose-driven startup committed to making menstrual health education accessible, inclusive, and empowering for women and young people across all sections of society.",
};

export default async function AboutPage() {
  const [aboutPage] = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, "about"))
    .limit(1);

  const title = aboutPage?.title || "About Us";
  const content =
    aboutPage?.content ||
    `We are a purpose-driven startup committed to making menstrual health education accessible, inclusive, and empowering for women and young people across all sections of society.

Our work focuses on educating young girls and children approaching menstrual age, breaking the stigma surrounding menstruation, and helping individuals understand menstrual hygiene, manage challenges, and make informed choices about their menstrual health.

Through educational publications, awareness programmes, community outreach, and menstrual hygiene initiatives, we aim to create a society where menstruation is understood, discussed openly, and managed with confidence and dignity.

As the brand owners of Samaura Menstrual Cups, we also promote awareness and informed adoption of menstrual cups as a reusable alternative to disposable sanitary pads, supporting individuals who wish to transition towards more sustainable menstrual hygiene practices.

Our mission is to combine education, awareness, and accessible menstrual hygiene solutions to make a meaningful difference in the lives of women and girls.

### Mission
To empower women, girls, and young people through accessible menstrual health education, community awareness, and practical menstrual hygiene solutions, ensuring that no one is left uninformed or unsupported during menstruation.

### Vision
A society where menstruation is free from stigma, every young person has access to age-appropriate menstrual education, and every individual can make informed choices about menstrual hygiene with confidence, dignity, and access to appropriate products.`;

  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Our Purpose &amp; Mission</span>
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
