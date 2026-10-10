import React from "react";
import type { Metadata } from "next";
import { Sparkles, HeartHandshake } from "lucide-react";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { renderMarkdownToHtml } from "@/lib/markdown";
import { filterDuplicateTitleAndLead } from "@/lib/utils/cms";
import {
  PageHero,
  ContentSection,
  FeatureCard,
  CtaBand,
  Reveal,
} from "@/components/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Awareness & Support | Samaura Healthcare",
  description:
    "Participate in menstrual cup awareness sessions and educational programmes to learn more about reusable menstrual products.",
  alternates: {
    canonical: "/awareness",
  },
  openGraph: {
    title: "Awareness & Support | Samaura Healthcare",
    description:
      "Participate in menstrual cup awareness sessions and educational programmes to learn more about reusable menstrual products.",
    url: "/awareness",
  },
};

export default async function AwarenessPage() {
  const [awarenessPage] = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, "awareness"))
    .limit(1);

  const title = awarenessPage?.title || "Awareness & Support";
  const defaultLead =
    "Participate in menstrual cup awareness sessions and educational programmes to learn more about reusable menstrual products.";
  const rawContent = awarenessPage?.content?.trim() || "";

  // Skip title and lead if they duplicate hero
  const filteredContent = filterDuplicateTitleAndLead(rawContent, title, defaultLead);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <PageHero
        breadcrumbLabel="Awareness"
        eyebrow="Community education"
        title={title}
        lead={defaultLead}
      />

      {/* Main Content Section */}
      <ContentSection ariaLabelledBy="awareness-content-heading" className="py-10 sm:py-16">
        <h2 id="awareness-content-heading" className="sr-only">
          Educational programmes and community workshops
        </h2>

        <div className="space-y-12 sm:space-y-16">
          {/* Two Pillar Cards as FeatureCards (stacked on mobile, 2 cols from 640px) */}
          <Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FeatureCard
                icon={Sparkles}
                title="Breaking stigma with knowledge"
                description="Our educational outreach empowers women, girls, and communities across all sections of society to understand menstrual hygiene, discuss menstruation openly, and make informed choices."
              />
              <FeatureCard
                icon={HeartHandshake}
                title="Reusable transition guidance"
                description="Practical sessions addressing hygiene, usage, comfort, and care to support individuals who wish to transition from disposable sanitary pads to reusable menstrual cups."
              />
            </div>
          </Reveal>

          {/* Body Text in readable column on clean white surface */}
          {filteredContent && (
            <Reveal delayMs={100}>
              <div
                className="prose prose-sm sm:prose-base max-w-prose text-muted font-sans font-normal leading-relaxed [&>h2]:font-heading [&>h2]:font-semibold [&>h2]:text-ink [&>h3]:font-heading [&>h3]:font-semibold [&>h3]:text-ink [&>strong]:text-ink"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdownToHtml(filteredContent),
                }}
              />
            </Reveal>
          )}

          {/* Closing CTA Band */}
          <Reveal delayMs={150}>
            <CtaBand
              title="Host an Awareness Programme"
              description="Interested in conducting a workshop for your school, college, community, or workplace?"
              primaryAction={{
                label: "Request a session",
                href: "/contact?topic=awareness",
              }}
            />
          </Reveal>
        </div>
      </ContentSection>
    </main>
  );
}
