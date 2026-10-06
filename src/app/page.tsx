import React from "react";
import Link from "next/link";
import { getImageProps } from "next/image";
import { HERO_BANNER_CONFIG } from "@/config/banners";
import {
  BookOpen,
  Users,
  Sparkles,
  Gift,
  ArrowRight,
  ChevronRight,
  Heart,
  Quote,
  Star,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  pages,
  reviews,
  posts,
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getAllSettings } from "@/lib/services/settings";

export const revalidate = 60; // ISR cache for 60 seconds

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

export default async function HomePage() {
  // 1. Fetch settings from settings table
  const settingsMap = await getAllSettings();

  // 2. Fetch admin-editable content from pages table
  const allCmsPages = await db.select().from(pages);
  const initiativesCms = allCmsPages.find((p) => p.slug === "home-initiatives");
  const exploreCms = allCmsPages.find((p) => p.slug === "home-explore");
  const giftsCms = allCmsPages.find((p) => p.slug === "home-gifts");

  // 3. Fallback content matching Data_for_website.docx
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

  const defaultExplore = [
    {
      title: "Samaura Menstrual Cup",
      text: "Learn about the product, its features, usage, care, and how to get started with reusable menstrual hygiene.",
    },
    {
      title: "Learn Before You Transition",
      text: "Access educational resources, FAQs, and guidance to help you make an informed decision about menstrual cups.",
    },
    {
      title: "Awareness & Support",
      text: "Participate in menstrual cup awareness sessions and educational programmes to learn more about reusable menstrual products.",
    },
  ];

  const defaultGifts = [
    {
      title: "My First Period Gift Box",
      text: "An age-appropriate gift pack for girls approaching menarche, combining educational publications, personal-care essentials, and thoughtful keepsakes to help them feel informed and supported.",
    },
    {
      title: "Self-Care & Celebration Hampers",
      text: "Customisable gift packs for birthdays, special occasions, and celebrations, designed for girls and women with personal-care products, accessories, and meaningful additions.",
    },
    {
      title: "Custom & Institutional Gift Packs",
      text: "Personalised gift kits for schools, NGOs, CSR initiatives, and organisations, tailored to age groups, budgets, and programme objectives.",
    },
  ];

  const initiativeCards = parseMarkdownCards(initiativesCms?.content, defaultInitiatives);
  const exploreCards = parseMarkdownCards(exploreCms?.content, defaultExplore);
  const giftCards = parseMarkdownCards(giftsCms?.content, defaultGifts);

  // 4. Fetch published customer reviews ONLY (no fake reviews)
  const publishedReviews = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.isVerified, true), eq(reviews.status, "published")))
    .limit(3);

  // 5. Fetch published blog posts ONLY
  const latestArticles = await db
    .select()
    .from(posts)
    .where(eq(posts.isPublished, true))
    .orderBy(desc(posts.publishedAt))
    .limit(3);

  // Hero Banner image props for <picture> art direction
  const commonHeroProps = {
    alt: HERO_BANNER_CONFIG.alt,
    sizes: "100vw",
    priority: true,
  };

  const {
    props: { srcSet: desktopHeroSrcSet },
  } = getImageProps({
    ...commonHeroProps,
    width: HERO_BANNER_CONFIG.desktop.width,
    height: HERO_BANNER_CONFIG.desktop.height,
    src: HERO_BANNER_CONFIG.desktop.src,
  });

  const {
    props: { srcSet: mobileHeroSrcSet, ...mobileHeroRest },
  } = getImageProps({
    ...commonHeroProps,
    width: HERO_BANNER_CONFIG.mobile.width,
    height: HERO_BANNER_CONFIG.mobile.height,
    src: HERO_BANNER_CONFIG.mobile.src,
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Visually hidden h1 for accessibility & SEO */}
      <h1 className="sr-only">Samaura Healthcare</h1>

      {/* --------------------------------------------------------------------- */}
      {/* 1. HERO BANNER (IMAGE-ONLY, ART-DIRECTED, ZERO CLS) */}
      {/* --------------------------------------------------------------------- */}
      <section className="w-full overflow-hidden border-b border-pink-light/40 bg-blush">
        <Link
          href={HERO_BANNER_CONFIG.href}
          aria-label={HERO_BANNER_CONFIG.ariaLabel}
          className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <picture className="block w-full">
            <source
              media="(min-width: 768px)"
              srcSet={desktopHeroSrcSet}
              width={HERO_BANNER_CONFIG.desktop.width}
              height={HERO_BANNER_CONFIG.desktop.height}
            />
            <source
              media="(max-width: 767px)"
              srcSet={mobileHeroSrcSet}
              width={HERO_BANNER_CONFIG.mobile.width}
              height={HERO_BANNER_CONFIG.mobile.height}
            />
            <img
              {...mobileHeroRest}
              fetchPriority="high"
              decoding="async"
              alt={HERO_BANNER_CONFIG.alt}
              className="w-full h-auto block object-cover aspect-1536/2728 md:aspect-2728/1536"
            />
          </picture>
        </Link>
      </section>

      {/* Secondary Promo Strip from Settings */}
      <section className="bg-blush/40 py-3.5 border-b border-pink-light/40 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs sm:text-sm font-medium text-ink flex items-center justify-center flex-wrap gap-2">
            <span>
              {settingsMap["announcement_text"] ||
                "✨ Menstrual Health Education, Awareness & Sustainable Menstrual Cups"}
            </span>
            <Link
              href="/about"
              className="text-brand font-semibold hover:underline inline-flex items-center gap-0.5 ml-1"
            >
              Learn about our mission →
            </Link>
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 2. OUR KEY INITIATIVES (3 NEUTRAL CARDS) */}
      {/* --------------------------------------------------------------------- */}
      <section className="bg-white py-12 lg:py-18 border-b border-pink-light/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              What We Do
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-ink">
              {initiativesCms?.title || "Our Key Initiatives"}
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Combining education, awareness, and accessible solutions across society.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {initiativeCards.map((card, idx) => {
              const icons = [BookOpen, Users, Sparkles];
              const Icon = icons[idx] || Sparkles;
              return (
                <div
                  key={card.title}
                  className="bg-white rounded-3xl p-7 sm:p-8 border border-pink-light shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-blush text-brand flex items-center justify-center shadow-xs">
                      <Icon className="w-6 h-6" strokeWidth={1.75} />
                    </div>
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-ink leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted leading-relaxed">
                      {card.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 3. EXPLORE SAMAURA (3 NEUTRAL CARDS WITH LINKS) */}
      {/* --------------------------------------------------------------------- */}
      <section className="bg-blush/30 py-12 lg:py-18 border-b border-pink-light/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Get Started
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-ink">
              {exploreCms?.title || "Explore Samaura"}
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Discover reusable menstrual cups, educational guides, and community support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {exploreCards.map((card, idx) => {
              const links = [
                { href: "/category/menstrual-cups", label: "Explore Menstrual Cups" },
                { href: "/learn", label: "Read Transition Guide" },
                { href: "/awareness", label: "View Awareness Programmes" },
              ];
              const target = links[idx] || { href: "/shop", label: "Learn More" };

              return (
                <div
                  key={card.title}
                  className="bg-white rounded-3xl p-7 sm:p-8 border border-pink-light shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-3">
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-ink leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted leading-relaxed">
                      {card.text}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-blush">
                    <Link
                      href={target.href}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand hover:text-brand-dark transition-colors group"
                    >
                      <span>{target.label}</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 4. GIFT COLLECTIONS (3 NEUTRAL CARDS, LINK TO /gifts) */}
      {/* --------------------------------------------------------------------- */}
      <section className="bg-white py-12 lg:py-18 border-b border-pink-light/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Thoughtful Care
              </span>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-ink">
                {giftsCms?.title || "Gift Collections"}
              </h2>
            </div>
            <Link
              href="/gifts"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand hover:text-brand-dark transition-colors group"
            >
              <span>View All Gift Collections</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {giftCards.map((card, idx) => {
              const icons = [Heart, Gift, Building2];
              const Icon = icons[idx] || Gift;
              const tags = [
                "Menarche Support",
                "Celebrations & Birthdays",
                "Schools & CSR",
              ];
              const tag = tags[idx] || "Gift Kit";

              return (
                <div
                  key={card.title}
                  className="bg-white rounded-3xl p-7 sm:p-8 border border-pink-light shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-blush text-brand flex items-center justify-center shadow-xs">
                        <Icon className="w-6 h-6" strokeWidth={1.75} />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-brand bg-blush/60 px-2.5 py-1 rounded-full border border-pink-light">
                        {tag}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-ink leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted leading-relaxed">
                      {card.text}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-blush">
                    <Link
                      href="/gifts"
                      className="btn-brand w-full text-xs font-semibold py-2.5 flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>Explore Collection</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* CUSTOMER REVIEWS (RENDERED ONLY IF PUBLISHED REVIEWS EXIST IN DB) */}
      {/* --------------------------------------------------------------------- */}
      {publishedReviews.length > 0 && (
        <section className="bg-blush/40 py-10 lg:py-16 border-b border-pink-light/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Feedback
              </span>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-ink">
                Community Feedback
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {publishedReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-pink-light shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <Quote className="w-7 h-7 text-pink-light" strokeWidth={1.75} />
                    <div className="flex items-center gap-1">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-ink leading-relaxed italic">
                      &ldquo;{rev.body}&rdquo;
                    </p>
                  </div>
                  <div className="pt-4 border-t border-blush flex items-center justify-between">
                    <h4 className="font-heading font-semibold text-sm text-ink">
                      {rev.userName}
                    </h4>
                    <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Community Review
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* PERIOD HEALTH DESK (RENDERED ONLY IF PUBLISHED ARTICLES EXIST) */}
      {/* --------------------------------------------------------------------- */}
      {latestArticles.length > 0 && (
        <section className="bg-white py-10 lg:py-16 border-b border-pink-light/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Educational Publications
                </span>
                <h2 className="font-heading font-bold text-2xl sm:text-3xl text-ink">
                  From Our Health Desk
                </h2>
              </div>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
              >
                <span>Read All Publications</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/blog/${article.slug}`}
                  className="bg-white rounded-3xl border border-pink-light shadow-xs p-6 space-y-3 hover:shadow-md transition-all"
                >
                  <h3 className="font-heading font-bold text-base text-ink">
                    {article.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed line-clamp-3">
                    {article.excerpt}
                  </p>
                  <span className="text-brand text-xs font-semibold inline-flex items-center gap-1 pt-2">
                    Read Article →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 5. CLOSING PURPOSE BANNER */}
      {/* --------------------------------------------------------------------- */}
      <section className="bg-linear-to-b from-blush/60 to-blush py-12 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-white mx-auto flex items-center justify-center text-ink shadow-xs border border-pink-light">
            <Sparkles className="w-8 h-8 text-brand" strokeWidth={1.75} />
          </div>
          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-ink">
              Creating a Society Where Menstruation is Handled with Dignity
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              We combine age-appropriate education, community outreach, and practical reusable hygiene solutions so no one is left uninformed or unsupported.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/about"
              className="btn-brand text-xs sm:text-sm font-semibold py-3.5 px-8 shadow-md flex items-center gap-2"
            >
              About Our Purpose <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact?topic=awareness"
              className="px-6 py-3.5 rounded-full text-xs sm:text-sm font-semibold bg-white border border-pink-light hover:bg-blush text-ink transition-colors shadow-xs"
            >
              Request a Workshop
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
