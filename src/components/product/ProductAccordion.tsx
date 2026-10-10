"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  Droplets,
  Leaf,
  HelpCircle,
  FileText,
} from "lucide-react";

export interface FaqItem {
  q: string;
  a: string;
}

export interface ProductAccordionProps {
  ingredients?: string | null;
  absorptionGuide?: string | null;
  usageGuide?: string | null;
  features?: string | null; // JSON string
  faq?: string | null; // JSON string
  flowType?: string | null;
}

export function ProductAccordion({
  ingredients,
  absorptionGuide,
  usageGuide,
  features,
  faq,
  flowType,
}: ProductAccordionProps) {
  // Parse JSON data safely
  let parsedFeatures: string[] = [];
  if (features) {
    try {
      parsedFeatures = JSON.parse(features);
    } catch {
      parsedFeatures = [];
    }
  }

  let parsedFaq: FaqItem[] = [];
  if (faq) {
    try {
      parsedFaq = JSON.parse(faq);
    } catch {
      parsedFaq = [];
    }
  }

  // Active accordion tabs (default open the first tab: absorption guide)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    absorption: true,
    ingredients: true,
    usage: false,
    faq: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-4">
      {/* 1. Absorption & Flow Guide (Render strictly when field has content) */}
      {Boolean(absorptionGuide?.trim() || parsedFeatures.length > 0) && (
        <div className="rounded-3xl border border-pink-light bg-white overflow-hidden shadow-xs transition-all">
          <button
            onClick={() => toggleSection("absorption")}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-blush/30 transition-colors focus:outline-none"
            aria-expanded={openSections.absorption}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blush flex items-center justify-center text-rose shrink-0">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-base text-ink">
                  Absorption &amp; Flow Guide
                </h3>
                {flowType && (
                  <span className="text-xs font-medium text-muted">
                    Flow: {flowType}
                  </span>
                )}
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-muted transition-transform duration-300 ${
                openSections.absorption ? "rotate-180 text-ink" : ""
              }`}
            />
          </button>

          {openSections.absorption && (
            <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-muted border-t border-blush leading-relaxed space-y-3">
              {absorptionGuide && <p>{absorptionGuide}</p>}
              {parsedFeatures.length > 0 && (
                <div className="pt-2">
                  <span className="font-semibold text-ink block mb-2">Key Protection Features:</span>
                  <ul className="space-y-1.5 list-disc pl-5 text-xs text-ink">
                    {parsedFeatures.map((feat, idx) => (
                      <li key={idx}>{feat}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Honest Ingredients (Render strictly when field has content) */}
      {Boolean(ingredients?.trim()) && (
        <div className="rounded-3xl border border-pink-light bg-white overflow-hidden shadow-xs transition-all">
          <button
            onClick={() => toggleSection("ingredients")}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-blush/30 transition-colors focus:outline-none"
            aria-expanded={openSections.ingredients}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                <Leaf className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-base text-ink">
                  Carefully Selected Ingredients &amp; Materials
                </h3>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-muted transition-transform duration-300 ${
                openSections.ingredients ? "rotate-180 text-ink" : ""
              }`}
            />
          </button>

          {openSections.ingredients && (
            <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-muted border-t border-blush leading-relaxed space-y-3">
              <p className="bg-blush/50 p-4 rounded-2xl border border-pink-light/60 text-ink">
                {ingredients}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. Usage & Eco Disposal Instructions (Render strictly when field has content) */}
      {Boolean(usageGuide?.trim()) && (
        <div className="rounded-3xl border border-pink-light bg-white overflow-hidden shadow-xs transition-all">
          <button
            onClick={() => toggleSection("usage")}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-blush/30 transition-colors focus:outline-none"
            aria-expanded={openSections.usage}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blush flex items-center justify-center text-rose shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-base text-ink">
                  How to Use &amp; Safe Disposal
                </h3>
                <span className="text-xs text-muted">
                  Simple, mindful steps for hygiene and care
                </span>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-muted transition-transform duration-300 ${
                openSections.usage ? "rotate-180 text-ink" : ""
              }`}
            />
          </button>

          {openSections.usage && (
            <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-muted border-t border-blush leading-relaxed whitespace-pre-line">
              {usageGuide}
            </div>
          )}
        </div>
      )}

      {/* 4. Frequently Asked Questions (Render strictly when field has content) */}
      {parsedFaq.length > 0 && (
        <div className="rounded-3xl border border-pink-light bg-white overflow-hidden shadow-xs transition-all">
          <button
            onClick={() => toggleSection("faq")}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-blush/30 transition-colors focus:outline-none"
            aria-expanded={openSections.faq}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blush flex items-center justify-center text-rose shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-base text-ink">
                  Frequently Asked Questions
                </h3>
                <span className="text-xs text-muted">
                  Common questions answered by our care team
                </span>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-muted transition-transform duration-300 ${
                openSections.faq ? "rotate-180 text-ink" : ""
              }`}
            />
          </button>

          {openSections.faq && (
            <div className="px-5 sm:px-6 pb-6 pt-1 space-y-4 border-t border-blush">
              {parsedFaq.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="font-heading font-semibold text-xs sm:text-sm text-ink">
                    Q: {item.q}
                  </h4>
                  <p className="text-xs text-muted leading-relaxed">
                    A: {item.a}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
