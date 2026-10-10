"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import type { StorefrontTestimonial } from "@/lib/services/testimonials";

interface ReviewsCarouselProps {
  testimonials: StorefrontTestimonial[];
}

export function ReviewsCarousel({ testimonials }: ReviewsCarouselProps) {
  // Production filter safeguard: strictly exclude sample testimonials in production
  const isProduction = process.env.NODE_ENV === "production";
  const items = isProduction
    ? testimonials.filter((t) => t.isPublished && !t.isSample)
    : testimonials.filter((t) => t.isPublished);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  const containerRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Listen to tab visibility
  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // IntersectionObserver: pause when out of view
  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const totalItems = items.length;

  const scrollToIndex = useCallback(
    (index: number) => {
      if (!trackRef.current) return;
      const track = trackRef.current;
      const cards = Array.from(track.children) as HTMLElement[];
      const safeIndex = Math.max(0, Math.min(index, totalItems - 1));

      if (cards[safeIndex]) {
        const targetCard = cards[safeIndex];
        track.scrollTo({
          left: targetCard.offsetLeft - track.offsetLeft,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
        setActiveIndex(safeIndex);
      }
    },
    [totalItems, prefersReducedMotion]
  );

  const handlePrev = useCallback(() => {
    const prev = activeIndex <= 0 ? totalItems - 1 : activeIndex - 1;
    scrollToIndex(prev);
  }, [activeIndex, totalItems, scrollToIndex]);

  const handleNext = useCallback(() => {
    const next = activeIndex >= totalItems - 1 ? 0 : activeIndex + 1;
    scrollToIndex(next);
  }, [activeIndex, totalItems, scrollToIndex]);

  // Auto-advance one card every 4 seconds
  useEffect(() => {
    if (totalItems <= 1) return;
    if (
      isHovered ||
      isFocused ||
      isTouching ||
      isTabHidden ||
      !isInView ||
      prefersReducedMotion
    ) {
      return;
    }

    const timer = setInterval(() => {
      handleNext();
    }, 4000);

    return () => clearInterval(timer);
  }, [
    totalItems,
    isHovered,
    isFocused,
    isTouching,
    isTabHidden,
    isInView,
    prefersReducedMotion,
    handleNext,
  ]);

  // Keep active index updated on user manual touch/scroll
  const handleScroll = () => {
    if (!trackRef.current) return;
    const track = trackRef.current;
    const scrollLeft = track.scrollLeft;
    const firstChild = track.firstElementChild as HTMLElement | null;
    if (firstChild) {
      const cardWidth = firstChild.getBoundingClientRect().width;
      const gap = 24; // gap-6
      const newIndex = Math.round(scrollLeft / (cardWidth + gap));
      if (newIndex >= 0 && newIndex < totalItems && newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    }
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <section
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="What Our Customers Say"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          handlePrev();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          handleNext();
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onTouchStart={() => setIsTouching(true)}
      onTouchEnd={() => setIsTouching(false)}
      className="w-full relative overflow-hidden outline-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div className="space-y-2 max-w-xl">
            <span className="badge-brand text-xs font-bold tracking-wider uppercase">
              Customer Experiences
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl text-ink font-semibold tracking-tight">
              What Our Customers Say
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Real feedback on our prompt delivery, discreet packaging, and dedicated care.
            </p>
          </div>

          {/* Controls: Prev, Next */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {/* Prev Button */}
            <button
              onClick={handlePrev}
              aria-label="Previous review"
              className="w-11 h-11 min-w-11 min-h-11 rounded-full border border-pink-light bg-white text-ink hover:bg-blush hover:border-brand/40 flex items-center justify-center transition-all shadow-xs active:scale-95"
              title="Previous review"
            >
              <ChevronLeft className="w-5 h-5 text-ink" />
            </button>

            {/* Next Button */}
            <button
              onClick={handleNext}
              aria-label="Next review"
              className="w-11 h-11 min-w-11 min-h-11 rounded-full border border-pink-light bg-white text-ink hover:bg-blush hover:border-brand/40 flex items-center justify-center transition-all shadow-xs active:scale-95"
              title="Next review"
            >
              <ChevronRight className="w-5 h-5 text-ink" />
            </button>
          </div>
        </div>

        {/* CSS Scroll-Snap Track inside overflow-hidden container */}
        <div className="relative overflow-hidden w-full">
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar py-2 px-0.5 min-h-65 sm:min-h-60 items-stretch"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 snap-start flex flex-col min-w-0"
              >
                <div className="card-soft h-full flex flex-col justify-between bg-white p-5 sm:p-6 rounded-2xl border border-blush/80 shadow-xs hover:border-pink-light transition-all duration-300 relative min-w-0">
                  <div className="space-y-3.5 min-w-0">
                    {/* Top Row: Stars + Quote Icon + Sample Tag */}
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      {/* Star Rating with WCAG aria-label */}
                      <div
                        className="flex items-center gap-1 shrink-0"
                        role="img"
                        aria-label={`${item.rating} out of 5`}
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= item.rating
                                ? "fill-amber-400 text-amber-400"
                                : "fill-slate-200 text-slate-200"
                            }`}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Quote className="w-4 h-4 text-brand/30" />
                      </div>
                    </div>

                    {/* Review Body (line-clamp-5) */}
                    <p className="text-xs sm:text-sm text-ink-muted leading-relaxed line-clamp-5 min-w-0">
                      &ldquo;{item.body}&rdquo;
                    </p>
                  </div>

                  {/* Customer Meta */}
                  <div className="pt-4 mt-4 border-t border-blush flex items-baseline justify-between gap-2 min-w-0">
                    <span className="font-heading font-semibold text-xs sm:text-sm text-ink truncate min-w-0">
                      {item.name}
                    </span>
                    {item.city && (
                      <span className="text-[11px] text-muted shrink-0">
                        {item.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dot Indicators */}
        {totalItems > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to slide ${i + 1} of ${totalItems}`}
                className={`transition-all duration-300 rounded-full ${
                  activeIndex === i
                    ? "w-6 h-2 bg-brand"
                    : "w-2 h-2 bg-pink-light hover:bg-brand/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
