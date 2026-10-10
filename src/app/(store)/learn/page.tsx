import React from "react";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { renderMarkdownToHtml } from "@/lib/markdown";
import { filterDuplicateTitleAndLead } from "@/lib/utils/cms";
import {
  PageHero,
  ContentSection,
  CtaBand,
  Reveal,
} from "@/components/content";

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
  const defaultLead =
    "Access educational resources, FAQs, and guidance to help you make an informed decision about menstrual cups.";
  const rawContent = learnPage?.content?.trim() || "";

  // Skip title and lead if they duplicate hero
  const filteredContent = filterDuplicateTitleAndLead(rawContent, title, defaultLead);

  // Check if custom resources/FAQ content exists beyond the standard introduction
  const hasResources =
    filteredContent.length > 0 &&
    (filteredContent.toLowerCase().includes("faq") ||
      filteredContent.toLowerCase().includes("guide") ||
      filteredContent.toLowerCase().includes("resource"));

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <PageHero
        breadcrumbLabel="Learn"
        eyebrow="Educational resources"
        title={title}
        lead={defaultLead}
      />

      {/* Main Content Section */}
      <ContentSection ariaLabelledBy="learn-content-heading" className="py-10 sm:py-16">
        <h2 id="learn-content-heading" className="sr-only">
          Educational resources and transition guidance
        </h2>

        <div className="space-y-12 sm:space-y-16">
          {/* Body Text in single readable column (max-w-prose) on clean white surface */}
          {filteredContent && (
            <Reveal>
              <div
                className="prose prose-sm sm:prose-base max-w-prose text-muted font-sans font-normal leading-relaxed [&>h2]:font-heading [&>h2]:font-semibold [&>h2]:text-ink [&>h3]:font-heading [&>h3]:font-semibold [&>h3]:text-ink [&>strong]:text-ink"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdownToHtml(filteredContent),
                }}
              />
            </Reveal>
          )}

          {/* Resources Area: compact note if no dedicated FAQ/resources content exists */}
          {!hasResources && (
            <Reveal delayMs={100}>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-muted bg-[#FFF8FA] border border-pink-light/70 rounded-xl px-4 py-2.5 max-w-prose">
                <Sparkles
                  className="w-5 h-5 text-rose-700 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>
                  Resources coming soon &mdash; user guides and care FAQs will be published here.
                </span>
              </div>
            </Reveal>
          )}

          {/* Closing CTA Band with existing actions */}
          <Reveal delayMs={150}>
            <CtaBand
              title="Ready to explore reusable hygiene?"
              description="Learn more about Samaura Menstrual Cups or attend an awareness workshop."
              secondaryAction={{
                label: "Awareness & Support",
                href: "/awareness",
              }}
              primaryAction={{
                label: "View Products",
                href: "/category/menstrual-cups",
              }}
            />
          </Reveal>
        </div>
      </ContentSection>
    </main>
  );
}
