import { Metadata } from "next";
import Link from "next/link";
import { Clock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Period Care Guide & Blog | Samaura Healthcare",
  description: "Doctor-reviewed menstrual care guides, cup sterilization tutorials, and intimate wellness tips.",
};

const ARTICLES = [
  {
    slug: "demystifying-menstrual-cups",
    title: "How to Choose Your First Menstrual Cup: Size, Fold & Sterilization",
    excerpt: "Everything you need to know about switching from pads to menstrual cups. Discover the punch-down fold, stem trimming, and 12-hour leak-free comfort.",
    category: "Menstrual Cups",
    readTime: "5 min read",
    date: "October 2026",
  },
  {
    slug: "why-organic-cotton-prevents-rashes",
    title: "Why Plastic Sanitary Pads Cause Itching & How Organic Cotton Solves It",
    excerpt: "Learn how non-breathable plastic topsheets trap heat and sweat, triggering chafing rashes and micro-tears during active periods.",
    category: "Skin Health",
    readTime: "4 min read",
    date: "September 2026",
  },
  {
    slug: "understanding-intimate-ph-balance",
    title: "Understanding Vaginal pH (3.5–4.5): Why Regular Soap Causes Harm",
    excerpt: "Why alkaline body soaps strip natural lactic acid and good lactobacilli bacteria, leading to recurrent candidiasis and bacterial vaginosis.",
    category: "Intimate Wellness",
    readTime: "6 min read",
    date: "September 2026",
  },
];

export default function BlogPage() {
  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Educational Period Care</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink">
            Period Care Guides & Articles
          </h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed">
            Evidence-based guides, gynecologist-approved advice, and practical tips for smooth, painless cycles.
          </p>
        </div>

        {/* Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {ARTICLES.map((article) => (
            <article
              key={article.slug}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-pink-light shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand font-semibold bg-blush px-3 py-1 rounded-full">
                    {article.category}
                  </span>
                  <span className="text-muted flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {article.readTime}
                  </span>
                </div>

                <h2 className="font-heading font-bold text-lg text-ink hover:text-brand transition-colors line-clamp-2">
                  {article.title}
                </h2>

                <p className="text-xs text-muted leading-relaxed line-clamp-3">
                  {article.excerpt}
                </p>
              </div>

              <div className="pt-6 border-t border-blush mt-6 flex items-center justify-between">
                <span className="text-[11px] text-muted">{article.date}</span>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                >
                  Explore Products <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Footer Support Banner */}
        <div className="bg-blush rounded-3xl p-8 border border-pink-light text-center space-y-4">
          <h3 className="font-heading font-bold text-xl text-ink">
            Have a personal period or product query?
          </h3>
          <p className="text-xs sm:text-sm text-muted max-w-xl mx-auto">
            Our certified women wellness advisors are available on WhatsApp for 100% confidential assistance.
          </p>
          <Link href="/contact">
            <Button size="md" className="shadow-md">
              Ask Our Care Team
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
