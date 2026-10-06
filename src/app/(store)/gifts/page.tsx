import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Gift, Building2, Heart, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { renderMarkdownToHtml } from "@/lib/markdown";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Gift Collections | Samaura Healthcare",
  description:
    "Thoughtfully curated first-period gift packs, self-care celebration hampers, and custom institutional kits for schools, NGOs, and CSR programmes.",
  alternates: {
    canonical: "/gifts",
  },
  openGraph: {
    title: "Gift Collections | Samaura Healthcare",
    description:
      "Thoughtfully curated first-period gift packs, self-care celebration hampers, and custom institutional kits.",
    url: "/gifts",
  },
};

export default async function GiftsPage() {
  const [giftsPage] = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, "gifts"))
    .limit(1);

  const title = giftsPage?.title || "Gift Collections";
  const rawContent = giftsPage?.content?.trim() || "";

  const collections = [
    {
      title: "My First Period Gift Box",
      description:
        "An age-appropriate gift pack for girls approaching menarche, combining educational publications, personal-care essentials, and thoughtful keepsakes to help them feel informed and supported.",
      icon: Heart,
      enquireHref: "/contact?topic=gift",
      tag: "First Period Preparedness",
    },
    {
      title: "Self-Care & Celebration Hampers",
      description:
        "Customisable gift packs for birthdays, special occasions, and celebrations, designed for girls and women with personal-care products, accessories, and meaningful additions.",
      icon: Gift,
      enquireHref: "/contact?topic=gift",
      tag: "Special Occasions & Birthdays",
    },
    {
      title: "Custom & Institutional Gift Packs",
      description:
        "Personalised gift kits for schools, NGOs, CSR initiatives, and organisations, tailored to age groups, budgets, and programme objectives.",
      icon: Building2,
      enquireHref: "/contact?topic=institutional",
      tag: "Schools, NGOs & CSR",
    },
  ];

  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
            <Gift className="w-3.5 h-3.5" />
            <span>Curated Gifting &amp; Partnerships</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-ink leading-tight">
            {title}
          </h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed">
            Thoughtfully curated gift kits designed to educate, celebrate, and support young people and women across milestones and community initiatives.
          </p>
        </div>

        {/* 3 Collections Cards (Enquiry-Only) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-3xl p-7 border border-pink-light shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-blush text-brand flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-brand bg-blush/60 px-2.5 py-1 rounded-full border border-pink-light">
                      {item.tag}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-heading font-bold text-lg text-ink">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-blush mt-6">
                  <Link
                    href={item.enquireHref}
                    className="btn-brand w-full text-xs font-semibold py-2.5 flex items-center justify-center gap-2 shadow-xs"
                  >
                    Enquire Now <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Admin-editable CMS Content if customized */}
        {rawContent && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-pink-light shadow-xs">
            <div
              className="prose prose-sm sm:prose-base max-w-none text-ink leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(rawContent) }}
            />
          </div>
        )}

        {/* Institutional & CSR Partnership Banner */}
        <div className="rounded-3xl bg-linear-to-r from-blush via-white to-blush border border-pink-light p-8 sm:p-10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h3 className="font-heading font-bold text-lg sm:text-xl text-ink">
              Collaborations with Schools, NGOs &amp; CSR Partners
            </h3>
            <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
              We partner with institutions to tailor menstrual health education kits, learning publications, and practical hygiene solutions matching age groups, programme objectives, and budgets.
            </p>
          </div>
          <Link
            href="/contact?topic=institutional"
            className="btn-brand whitespace-nowrap text-xs sm:text-sm font-semibold py-3 px-6 shadow-md shrink-0"
          >
            Partner With Us &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
