import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Users, Sparkles, ArrowRight, HeartHandshake } from "lucide-react";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { renderMarkdownToHtml } from "@/lib/markdown";

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
  const defaultText =
    "Participate in menstrual cup awareness sessions and educational programmes to learn more about reusable menstrual products.";
  const rawContent = awarenessPage?.content?.trim() || "";

  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
            <Users className="w-3.5 h-3.5" />
            <span>Community Education &amp; Workshops</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-ink leading-tight">
            {title}
          </h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed">
            {defaultText}
          </p>
        </div>

        {/* Highlight Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-pink-light shadow-xs space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-blush/40 border border-pink-light/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white text-brand flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-ink">
                Breaking Stigma with Knowledge
              </h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Our educational outreach empowers women, girls, and communities across all sections of society to understand menstrual hygiene, discuss menstruation openly, and make informed choices.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-blush/40 border border-pink-light/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white text-brand flex items-center justify-center shadow-xs">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-ink">
                Reusable Transition Guidance
              </h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Practical sessions addressing hygiene, usage, comfort, and care to support individuals who wish to transition from disposable sanitary pads to reusable menstrual cups.
              </p>
            </div>
          </div>

          {rawContent && rawContent !== defaultText && (
            <div
              className="prose prose-sm sm:prose-base max-w-none text-ink leading-relaxed pt-4 border-t border-blush"
              dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(rawContent) }}
            />
          )}

          {/* Action CTA */}
          <div className="pt-4 border-t border-blush flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-heading font-bold text-base text-ink">
                Host an Awareness Programme
              </h4>
              <p className="text-xs text-muted">
                Interested in conducting a workshop for your school, college, community, or workplace?
              </p>
            </div>
            <Link
              href="/contact?topic=awareness"
              className="btn-brand whitespace-nowrap text-xs sm:text-sm font-semibold py-3 px-6 shadow-md inline-flex items-center gap-2"
            >
              Request a session <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
