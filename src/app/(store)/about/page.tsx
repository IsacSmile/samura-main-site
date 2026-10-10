import { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Users,
  Gift,
  ArrowRight,
  ChevronRight,
  Heart,
  Compass,
} from "lucide-react";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About Us | Samaura Healthcare",
  description:
    "We are a purpose-driven startup committed to making menstrual health education accessible, inclusive, and empowering for women and young people across all sections of society.",
};

function parseMarkdownCards(
  content: string | undefined,
  fallbackCards: { title: string; text: string }[]
): { title: string; text: string }[] {
  if (!content) return fallbackCards;
  const sections = content.split(/^###\s+/m).filter(Boolean);
  if (sections.length === 0) return fallbackCards;

  return sections.map((sec, idx) => {
    const lines = sec.trim().split("\n");
    const title = lines[0]?.trim() || fallbackCards[idx]?.title || "";
    const text =
      lines
        .slice(1)
        .join("\n")
        .trim() || fallbackCards[idx]?.text || "";
    return { title, text };
  });
}

export default async function AboutPage() {
  const allCmsPages = await db.select().from(pages);
  const aboutPage = allCmsPages.find((p) => p.slug === "about");
  const initiativesPage = allCmsPages.find((p) => p.slug === "home-initiatives");

  const title = aboutPage?.title || "About Samaura Healthcare";

  const defaultInitiatives = [
    {
      title: "Menstrual Health Education & Publications",
      text: "Providing age-appropriate menstrual health education to children and young people through educational programmes, books, and learning materials that promote understanding of menstruation, puberty, personal hygiene, and first-period preparedness.",
    },
    {
      title: "Menstrual Awareness & Community Empowerment",
      text: "Organising awareness sessions, workshops, and community outreach programmes to break menstrual stigma, address misconceptions, and empower women and girls across all sections of society to manage menstrual health with confidence and dignity.",
    },
    {
      title: "Sustainable Menstrual Hygiene, Thoughtful Gifting & Partnerships",
      text: "Promoting informed adoption of reusable menstrual products through Samaura Menstrual Cups, while developing thoughtfully curated gift packs for girls approaching menarche and for girls and women on special occasions. Through educational gifts and collaborations with schools, NGOs, communities, and CSR partners, we aim to make menstrual health education, awareness, and practical hygiene solutions more accessible.",
    },
  ];

  const initiativeCards = parseMarkdownCards(initiativesPage?.content, defaultInitiatives);

  return (
    <div className="bg-linear-to-b from-blush/30 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
        {/* =================================================================== */}
        {/* 1. EDITORIAL HEADER & MANIFESTO */}
        {/* =================================================================== */}
        <section className="space-y-8 max-w-4xl mx-auto text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand self-center sm:self-start">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Our Purpose &amp; Mission</span>
            </div>
            <span className="text-[11px] text-muted self-center sm:self-auto">
              Last updated: {aboutPage ? new Date(aboutPage.updatedAt).toLocaleDateString() : "Recent"}
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="font-heading font-semibold text-3xl sm:text-5xl lg:text-6xl text-ink tracking-tight leading-tight">
              {title}
            </h1>
            <p className="font-serif italic text-lg sm:text-2xl text-ink-muted leading-snug max-w-3xl border-l-2 border-brand/40 pl-4 sm:pl-6 text-left my-6">
              &ldquo;We are a purpose-driven startup committed to making menstrual health education accessible, inclusive, and empowering for women and young people across all sections of society.&rdquo;
            </p>
          </div>

          {/* Narrative Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 pt-4 text-xs sm:text-sm text-muted leading-relaxed text-left">
            <div className="space-y-3">
              <p>
                Our work focuses on educating young girls and children approaching menstrual age, breaking the stigma surrounding menstruation, and helping individuals understand menstrual hygiene, manage challenges, and make informed choices about their menstrual health.
              </p>
              <p>
                Through educational publications, awareness programmes, community outreach, and menstrual hygiene initiatives, we aim to create a society where menstruation is understood, discussed openly, and managed with confidence and dignity.
              </p>
            </div>
            <div className="space-y-3">
              <p>
                As the brand owners of Samaura Menstrual Cups, we also promote awareness and informed adoption of menstrual cups as a reusable alternative to disposable sanitary pads, supporting individuals who wish to transition towards more sustainable menstrual hygiene practices.
              </p>
              <p>
                Our mission is to combine education, awareness, and accessible menstrual hygiene solutions to make a meaningful difference in the lives of women and girls.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 2. OUR KEY INITIATIVES — BESPOKE EDITORIAL SHOWCASE */}
        {/* =================================================================== */}
        <section className="space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              What We Do
            </span>
            <h2 className="font-heading text-2xl sm:text-4xl text-ink font-semibold tracking-tight">
              {initiativesPage?.title || "Our Key Initiatives"}
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Combining education, awareness, and accessible solutions across society.
            </p>
          </div>

          {/* Asymmetrical Editorial Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
            {/* --------------------------------------------------------------- */}
            {/* Pillar 01: Education & Publications (5 cols) */}
            {/* --------------------------------------------------------------- */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-7 sm:p-9 border border-pink-light shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 pointer-events-none select-none text-rose/15 font-serif font-bold text-7xl sm:text-8xl leading-none">
                01
              </div>

              <div className="space-y-5 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blush text-brand flex items-center justify-center shadow-xs">
                    <BookOpen className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand bg-blush px-3 py-1 rounded-full border border-pink-light">
                    Learning Pillar
                  </span>
                </div>

                <div className="space-y-2.5">
                  <h3 className="font-heading font-medium text-lg sm:text-xl text-ink leading-snug">
                    {initiativeCards[0]?.title || defaultInitiatives[0].title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">
                    {initiativeCards[0]?.text || defaultInitiatives[0].text}
                  </p>
                </div>

                {/* Micro tags */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="text-[11px] font-medium text-ink bg-blush/60 px-2.5 py-1 rounded-full border border-pink-light/60">
                    Age-Appropriate Publications
                  </span>
                  <span className="text-[11px] font-medium text-ink bg-blush/60 px-2.5 py-1 rounded-full border border-pink-light/60">
                    First-Period Preparedness
                  </span>
                  <span className="text-[11px] font-medium text-ink bg-blush/60 px-2.5 py-1 rounded-full border border-pink-light/60">
                    Puberty Guidance
                  </span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-blush relative z-10">
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand hover:text-brand-dark transition-colors group-hover:underline"
                >
                  <span>Explore Educational Resources</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* Pillar 02: Awareness & Community Empowerment (6 cols) */}
            {/* --------------------------------------------------------------- */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-7 sm:p-9 border border-pink-light shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 pointer-events-none select-none text-rose/15 font-serif font-bold text-7xl sm:text-8xl leading-none">
                02
              </div>

              <div className="space-y-5 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blush text-brand flex items-center justify-center shadow-xs">
                    <Users className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand bg-blush px-3 py-1 rounded-full border border-pink-light">
                    Community Pillar
                  </span>
                </div>

                <div className="space-y-2.5">
                  <h3 className="font-heading font-medium text-lg sm:text-xl text-ink leading-snug">
                    {initiativeCards[1]?.title || defaultInitiatives[1].title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">
                    {initiativeCards[1]?.text || defaultInitiatives[1].text}
                  </p>
                </div>

                {/* Micro tags */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="text-[11px] font-medium text-ink bg-blush/60 px-2.5 py-1 rounded-full border border-pink-light/60">
                    Stigma-Free Outreach
                  </span>
                  <span className="text-[11px] font-medium text-ink bg-blush/60 px-2.5 py-1 rounded-full border border-pink-light/60">
                    Educational Workshops
                  </span>
                  <span className="text-[11px] font-medium text-ink bg-blush/60 px-2.5 py-1 rounded-full border border-pink-light/60">
                    Community Dignity
                  </span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-blush relative z-10">
                <Link
                  href="/awareness"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand hover:text-brand-dark transition-colors group-hover:underline"
                >
                  <span>Learn About Awareness Programmes</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* Pillar 03: Sustainable Hygiene & Gifting (12 cols full width) */}
            {/* --------------------------------------------------------------- */}
            <div className="lg:col-span-12 bg-linear-to-br from-blush/70 via-white to-blush/40 rounded-3xl p-7 sm:p-10 border border-pink-light shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 pointer-events-none select-none text-rose/15 font-serif font-bold text-7xl sm:text-9xl leading-none">
                03
              </div>

              <div className="space-y-6 relative z-10 max-w-4xl">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white text-brand flex items-center justify-center shadow-xs border border-pink-light">
                    <Gift className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand bg-white px-3 py-1 rounded-full border border-pink-light shadow-xs">
                    Impact &amp; Solutions
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="font-heading font-medium text-xl sm:text-2xl text-ink leading-snug">
                    {initiativeCards[2]?.title || defaultInitiatives[2].title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">
                    {initiativeCards[2]?.text || defaultInitiatives[2].text}
                  </p>
                </div>

                {/* Micro tags */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[11px] font-medium text-ink bg-white px-3 py-1 rounded-full border border-pink-light shadow-2xs">
                    Samaura Menstrual Cups
                  </span>
                  <span className="text-[11px] font-medium text-ink bg-white px-3 py-1 rounded-full border border-pink-light shadow-2xs">
                    First Period Gift Boxes
                  </span>
                  <span className="text-[11px] font-medium text-ink bg-white px-3 py-1 rounded-full border border-pink-light shadow-2xs">
                    Schools, NGOs &amp; CSR Collaborations
                  </span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-pink-light/60 flex flex-wrap items-center gap-4 relative z-10">
                <Link
                  href="/gifts"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand hover:text-brand-dark transition-colors group-hover:underline"
                >
                  <span>Explore Gift Collections</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <span className="text-muted hidden sm:inline">•</span>
                <Link
                  href="/category/menstrual-cups"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand hover:text-brand-dark transition-colors group-hover:underline"
                >
                  <span>Explore Menstrual Cups</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 3. MISSION & VISION DUAL PILLARS */}
        {/* =================================================================== */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Guiding Principles
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl text-ink font-semibold tracking-tight">
              Mission &amp; Vision
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Mission */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-pink-light shadow-xs space-y-4 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-blush text-brand flex items-center justify-center">
                <Compass className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-heading font-medium text-xl text-ink">
                Our Mission
              </h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                To empower women, girls, and young people through accessible menstrual health education, community awareness, and practical menstrual hygiene solutions, ensuring that no one is left uninformed or unsupported during menstruation.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-pink-light shadow-xs space-y-4 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-blush text-brand flex items-center justify-center">
                <Heart className="w-5 h-5 text-brand" strokeWidth={1.75} />
              </div>
              <h3 className="font-heading font-medium text-xl text-ink">
                Our Vision
              </h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                A society where menstruation is free from stigma, every young person has access to age-appropriate menstrual education, and every individual can make informed choices about menstrual hygiene with confidence, dignity, and access to appropriate products.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 4. COLLABORATE & REACH OUT BANNER */}
        {/* =================================================================== */}
        <div className="bg-blush/60 rounded-3xl p-8 sm:p-12 border border-pink-light flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="font-heading font-medium text-xl sm:text-2xl text-ink tracking-tight">
              Collaborate With Us for Education &amp; Awareness
            </h3>
            <p className="text-xs sm:text-sm text-muted max-w-xl leading-relaxed">
              Whether you are an educator, community leader, organisation planning a CSR initiative, or someone seeking information on reusable menstrual hygiene, our team is here to help.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <Link
              href="/contact"
              className="text-xs font-semibold px-5 py-3 rounded-full border border-pink-light bg-white hover:bg-blush text-ink shadow-xs transition-colors"
            >
              Contact Our Team
            </Link>
            <Link
              href="/shop"
              className="btn-brand text-xs font-semibold py-3 px-6 shadow-xs flex items-center gap-1.5"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
