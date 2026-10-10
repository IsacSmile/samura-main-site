import React from "react";
import Link from "next/link";
import { getImageProps } from "next/image";
import { HERO_BANNER_CONFIG } from "@/config/banners";
import {
  Sparkles,
  ChevronRight,
  ArrowRight,
  Users,
} from "lucide-react";
import { getAllSettings } from "@/lib/services/settings";
import { getFeaturedProducts, getBestsellerProducts } from "@/lib/services/products";
import { getStorefrontTestimonials } from "@/lib/services/testimonials";
import { ProductCard } from "@/components/product/ProductCard";
import { ReviewsCarousel } from "@/components/home/ReviewsCarousel";

export const revalidate = 60; // ISR cache for 60 seconds

export default async function HomePage() {
  // 1. Fetch settings from settings table
  const settingsMap = await getAllSettings();

  // 4. Fetch Top Products & Bestsellers independently (max 8)
  const featuredProducts = await getFeaturedProducts(8);
  const bestsellerProducts = await getBestsellerProducts(8);

  // 5. Fetch storefront testimonials (environment-guarded)
  const storefrontTestimonials = await getStorefrontTestimonials();

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
      <h1 className="sr-only">Samaura Healthcare — Thoughtful Menstrual Hygiene & Education</h1>

      {/* --------------------------------------------------------------------- */}
      {/* 1. HERO BANNER (IMAGE-ONLY, ART-DIRECTED, ZERO CLS, FULL-VIEWPORT) */}
      {/* --------------------------------------------------------------------- */}
      <section className="w-full hero-banner-height overflow-hidden border-b border-pink-light/40 bg-blush relative z-0">
        <Link
          href={HERO_BANNER_CONFIG.href}
          aria-label={HERO_BANNER_CONFIG.ariaLabel}
          className="block w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <picture className="block w-full h-full">
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
              className="w-full h-full block object-cover object-center"
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
      {/* 2. OUR TOP PRODUCTS (WHITE BAND) */}
      {/* --------------------------------------------------------------------- */}
      {featuredProducts.length > 0 && (
        <section className="bg-white py-10 lg:py-16 border-b border-pink-light/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Featured Selection
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl text-ink font-semibold tracking-tight">
                  Our Top Products
                </h2>
              </div>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand hover:text-brand-dark transition-colors group self-start sm:self-auto"
              >
                <span>View all</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 min-w-0">
              {featuredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 3. OUR BESTSELLERS (BLUSH BAND) */}
      {/* --------------------------------------------------------------------- */}
      {bestsellerProducts.length > 0 && (
        <section className="bg-blush/30 py-10 lg:py-16 border-b border-pink-light/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
              <div className="space-y-1">
                <span className="badge-brand text-[10px] font-bold tracking-wider uppercase">
                  Customer Favourites
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl text-ink font-semibold tracking-tight">
                  Our Bestsellers
                </h2>
              </div>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand hover:text-brand-dark transition-colors group self-start sm:self-auto"
              >
                <span>View all</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 min-w-0">
              {bestsellerProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 4. REVIEWS CAROUSEL (WHITE BAND) */}
      {/* --------------------------------------------------------------------- */}
      {storefrontTestimonials.length > 0 && (
        <div className="bg-white py-10 lg:py-16 border-b border-pink-light/40">
          <ReviewsCarousel testimonials={storefrontTestimonials} />
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 5. CLOSING EDITORIAL MANIFESTO (PURPOSE & COMMUNITY PAVILION) */}
      {/* --------------------------------------------------------------------- */}
      <section className="bg-blush/20 py-12 sm:py-16 lg:py-20 border-b border-pink-light/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl sm:rounded-[2.5rem] bg-linear-to-br from-blush via-pink-50/70 to-pink-100/50 border border-pink-light/80 p-6 sm:p-10 lg:p-16 shadow-xs overflow-hidden">
            {/* Ambient subtle light accents */}
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-rose/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-brand-light/70 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Manifesto & Action (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Eyebrow badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-pink-light/80 text-brand shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                  <span className="text-[11px] font-bold tracking-[0.16em] uppercase">
                    Our Purpose &amp; Commitment
                  </span>
                </div>

                <div className="space-y-4">
                  <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl text-ink font-semibold tracking-tight leading-snug">
                    Creating a Society Where Menstruation is Handled with Dignity
                  </h2>
                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-xl">
                    We combine age-appropriate education, community outreach, and practical reusable hygiene solutions so no one is left uninformed or unsupported.
                  </p>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-xl">
                    From first-period preparedness for adolescent girls to open discussions in schools and community spaces, we believe confidence begins with compassionate understanding.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Link
                    href="/about"
                    className="btn-brand text-xs sm:text-sm font-semibold py-3.5 px-7 rounded-full shadow-sm hover:shadow-md transition-all inline-flex items-center justify-center gap-2 group text-center"
                  >
                    <span>About Our Purpose</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/contact?topic=awareness"
                    className="px-6 py-3.5 rounded-full text-xs sm:text-sm font-semibold bg-white border border-pink-light/90 hover:bg-blush hover:border-brand/40 text-ink transition-all shadow-xs inline-flex items-center justify-center gap-2 group text-center"
                  >
                    <Users className="w-4 h-4 text-brand" />
                    <span>Request a Workshop</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Editorial Dispatch Plaque (5 cols) */}
              <div className="lg:col-span-5">
                <div className="bg-white/95 backdrop-blur-xs rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-pink-light shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-blush">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blush text-brand flex items-center justify-center shadow-2xs">
                        <Sparkles className="w-4 h-4" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-ink tracking-tight">Community Pillars</p>
                        <p className="text-[11px] text-muted">Core initiatives driving change</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-brand bg-blush px-2.5 py-1 rounded-full border border-pink-light/60">
                      Social Impact
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-lg bg-blush/80 text-brand flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        01
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs sm:text-sm font-semibold text-ink">Age-Appropriate Education</h4>
                        <p className="text-xs text-muted leading-relaxed">
                          Clear publications and guides created for young learners approaching menarche.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-lg bg-blush/80 text-brand flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        02
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs sm:text-sm font-semibold text-ink">Open Dialogue</h4>
                        <p className="text-xs text-muted leading-relaxed">
                          Supportive spaces where menstrual health is discussed openly.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-lg bg-blush/80 text-brand flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        03
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs sm:text-sm font-semibold text-ink">Thoughtful Hygiene Solutions</h4>
                        <p className="text-xs text-muted leading-relaxed">
                          Comfortable reusable cups and personal hygiene essentials built for everyday life.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-blush flex items-center justify-between text-xs">
                    <span className="text-muted">Partner with our outreach team</span>
                    <Link
                      href="/contact?topic=awareness"
                      className="font-semibold text-brand hover:underline inline-flex items-center gap-1"
                    >
                      <span>Get in touch</span>
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
