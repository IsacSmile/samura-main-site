"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export interface FaqItem {
  question: string;
  answerHtml: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="bg-white rounded-3xl border border-pink-light shadow-xs overflow-hidden transition-all duration-200"
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              className="w-full text-left p-6 sm:p-7 flex items-center justify-between gap-4 hover:bg-blush/20 transition-colors"
              aria-expanded={isOpen}
            >
              <span className="font-heading font-bold text-base sm:text-lg text-ink flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <span>{item.question}</span>
              </span>
              <ChevronDown
                className={`w-5 h-5 text-muted transition-transform duration-200 shrink-0 ${
                  isOpen ? "rotate-180 text-brand" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-6 pb-6 sm:px-7 sm:pb-7 pt-0 border-t border-blush/50">
                <div
                  className="prose prose-sm max-w-none text-muted leading-relaxed pl-8 pt-3 text-xs sm:text-sm"
                  dangerouslySetInnerHTML={{ __html: item.answerHtml }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
