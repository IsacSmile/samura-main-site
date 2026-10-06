import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { renderMarkdownToHtml } from "@/lib/markdown";
import { getSetting } from "@/lib/services/settings";

export const revalidate = 60;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [article] = await db
    .select()
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);

  if (!article || !article.isPublished) {
    return {
      title: "Article Not Found | Samaura Healthcare",
    };
  }

  return {
    title: `${article.title} | Samaura Health Desk`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
      images: article.coverImage ? [{ url: article.coverImage }] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const [article] = await db
    .select()
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);

  // Draft / Unpublished check
  if (!article || !article.isPublished) {
    notFound();
  }

  // Fetch admin-editable medical disclaimer
  const medicalDisclaimer = await getSetting(
    "medical_disclaimer_text",
    "The educational articles and guidance published on the Samaura Period Health Desk are intended for general hygiene and wellness information only. They do not constitute formal medical diagnosis, clinical treatment, or gynecological advice. Always consult a qualified medical professional regarding persistent pelvic pain, abnormal bleeding, or medical concerns."
  );

  // Construct JSON-LD Article structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage ? [article.coverImage] : [],
    datePublished: article.publishedAt ? new Date(article.publishedAt).toISOString() : new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: article.author || "Samaura Health Desk",
    },
    publisher: {
      "@type": "Organization",
      name: "Samaura Healthcare",
      logo: {
        "@type": "ImageObject",
        url: "https://samaura.com/samura-main-site-logo.png",
      },
    },
  };

  const renderedContentHtml = renderMarkdownToHtml(article.content);

  return (
    <article className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      {/* JSON-LD Script tag */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Navigation back */}
        <div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-brand transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Guides
          </Link>
        </div>

        {/* Article Header */}
        <header className="space-y-4">
          <div className="inline-block bg-blush text-brand text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-pink-light">
            {article.category}
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight">
            {article.title}
          </h1>

          <p className="text-muted text-base sm:text-lg leading-relaxed">
            {article.excerpt}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted pt-2 border-t border-blush">
            <span className="font-medium text-ink">By {article.author}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(article.publishedAt).toLocaleDateString()}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.readTime}
            </span>
          </div>
        </header>

        {/* Cover Image */}
        {article.coverImage && (
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-md bg-blush border border-pink-light">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />
          </div>
        )}

        {/* Article Body Rendered from Sanitized Markdown */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-pink-light shadow-xs">
          <div
            className="prose prose-sm sm:prose-base max-w-none text-ink leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderedContentHtml }}
          />
        </div>

        {/* Admin-editable Medical Disclaimer */}
        <div className="bg-blush/60 rounded-3xl p-6 sm:p-8 border border-pink-light space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-ink">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Health &amp; Wellness Educational Disclaimer</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            {medicalDisclaimer}
          </p>
        </div>

        {/* Footer Next Steps */}
        <div className="border-t border-blush pt-8 flex items-center justify-between">
          <Link
            href="/blog"
            className="text-xs font-semibold text-brand hover:underline"
          >
            ← View More Educational Articles
          </Link>
          <Link
            href="/shop"
            className="btn-brand text-xs font-semibold py-2 px-5 shadow-xs"
          >
            Explore Pure Cotton Care →
          </Link>
        </div>
      </div>
    </article>
  );
}
