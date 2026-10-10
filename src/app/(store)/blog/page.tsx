import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Clock, ArrowRight, Sparkles, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { getSetting } from "@/lib/services/settings";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Period Care Guides & Blog | Samaura Healthcare",
  description:
    "Evidence-based menstrual health guides, menstrual cup transition tips, and hygiene education.",
};

const POSTS_PER_PAGE = 6;

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const resolvedParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);
  const offset = (currentPage - 1) * POSTS_PER_PAGE;

  // 1. Get total published count
  const [totalCountResult] = await db
    .select({ count: count() })
    .from(posts)
    .where(eq(posts.isPublished, true));
  const totalPosts = totalCountResult?.count || 0;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

  // 2. Query paginated published posts
  const publishedPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.isPublished, true))
    .orderBy(desc(posts.publishedAt))
    .limit(POSTS_PER_PAGE)
    .offset(offset);

  // 3. Fetch admin-editable medical disclaimer from settings
  const medicalDisclaimer = await getSetting(
    "medical_disclaimer_text",
    "The educational articles and guidance published on the Samaura Period Health Desk are intended for general hygiene and wellness information only. They do not constitute clinical guidance or gynecological consultation. Always consult a qualified physician regarding persistent cycle symptoms or physical concerns."
  );

  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Educational Period Care</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink">
            Period Care Guides &amp; Health Desk
          </h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed">
            Thoughtful hygiene insights, material breakdowns, and practical guidance for smooth, comfortable cycles.
          </p>
        </div>

        {/* Article Grid */}
        {publishedPosts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-muted border border-pink-light">
            No published articles at this time. Please check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {publishedPosts.map((article) => (
              <article
                key={article.id}
                className="bg-white rounded-3xl border border-pink-light shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-full aspect-16/10 bg-blush overflow-hidden">
                    {article.coverImage ? (
                      <Image
                        src={article.coverImage}
                        alt={article.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted">
                        Samaura Health Desk
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-brand text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-pink-light">
                      {article.category}
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{article.readTime}</span>
                      <span>•</span>
                      <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                    </div>

                    <h2 className="font-heading font-bold text-lg text-ink hover:text-brand transition-colors line-clamp-2">
                      <Link href={`/blog/${article.slug}`}>{article.title}</Link>
                    </h2>

                    <p className="text-xs text-muted leading-relaxed line-clamp-3">
                      {article.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-0 border-t border-blush/60 mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-muted">By {article.author}</span>
                  <Link
                    href={`/blog/${article.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  >
                    Read Guide <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            {currentPage > 1 ? (
              <Link
                href={`/blog?page=${currentPage - 1}`}
                className="p-2 rounded-xl border border-pink-light bg-white text-ink hover:bg-blush transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
            ) : (
              <span className="p-2 rounded-xl border border-pink-light/50 bg-gray-50 text-muted cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </span>
            )}

            <span className="text-xs font-semibold text-ink px-4 py-2 bg-white rounded-xl border border-pink-light">
              Page {currentPage} of {totalPages}
            </span>

            {currentPage < totalPages ? (
              <Link
                href={`/blog?page=${currentPage + 1}`}
                className="p-2 rounded-xl border border-pink-light bg-white text-ink hover:bg-blush transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="p-2 rounded-xl border border-pink-light/50 bg-gray-50 text-muted cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        )}

        {/* Admin-editable Medical Disclaimer Box */}
        <div className="bg-blush/60 rounded-3xl p-6 sm:p-8 border border-pink-light space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-ink">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Health &amp; Wellness Educational Disclaimer</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            {medicalDisclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
