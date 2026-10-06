import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, BookOpen, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { renderMarkdownToHtml } from "@/lib/markdown";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Learn Before You Transition | Samaura Healthcare",
  description:
    "Access educational resources, FAQs, and guidance to help you make an informed decision about menstrual cups.",
  alternates: {
    canonical: "/learn",
  },
  openGraph: {
    title: "Learn Before You Transition | Samaura Healthcare",
    description:
      "Access educational resources, FAQs, and guidance to help you make an informed decision about menstrual cups.",
    url: "/learn",
  },
};

export default async function LearnPage() {
  const [learnPage] = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, "learn"))
    .limit(1);

  const title = learnPage?.title || "Learn Before You Transition";
  const defaultText =
    "Access educational resources, FAQs, and guidance to help you make an informed decision about menstrual cups.";
  const rawContent = learnPage?.content?.trim() || "";

  // Check if client has provided custom content beyond the default overview
  const hasCustomContent =
    rawContent.length > 0 &&
    rawContent !== defaultText &&
    !rawContent.toLowerCase().includes("resources coming soon");

  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Menstrual Cup Education</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-ink leading-tight">
            {title}
          </h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed">
            {defaultText}
          </p>
        </div>

        {/* Content / Resources Section */}
        {hasCustomContent ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-pink-light shadow-xs">
            <div
              className="prose prose-sm sm:prose-base max-w-none text-ink leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(rawContent) }}
            />
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-pink-light shadow-xs space-y-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blush text-brand mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="font-heading font-bold text-xl text-ink">
                Resources coming soon
              </h2>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Comprehensive menstrual cup user guides, sizing recommendations, care instructions, and transition FAQs will be published here.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/contact?topic=cup"
                className="btn-brand inline-flex items-center gap-2 text-xs sm:text-sm font-semibold py-2.5 px-6 shadow-xs"
              >
                Ask a Question <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Action strip */}
        <div className="bg-blush rounded-3xl p-6 sm:p-8 border border-pink-light flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-heading font-semibold text-sm text-ink">
              Ready to explore reusable hygiene?
            </h3>
            <p className="text-xs text-muted">
              Learn more about Samaura Menstrual Cups or attend an awareness workshop.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/awareness"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-pink-light hover:bg-blush text-ink transition-colors"
            >
              Awareness &amp; Support
            </Link>
            <Link
              href="/category/menstrual-cups"
              className="btn-brand text-xs font-semibold py-2 px-4 shadow-xs"
            >
              View Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
