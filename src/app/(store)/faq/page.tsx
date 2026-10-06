import { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { renderMarkdownToHtml } from "@/lib/markdown";
import { FaqAccordion, FaqItem } from "@/components/store/FaqAccordion";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Samaura Healthcare",
  description:
    "Common questions about discreet shipping, pure cotton hygiene products, cup sizing, and returns.",
};

function parseFaqContent(markdown: string): { introHtml: string; items: FaqItem[] } {
  const lines = markdown.split("\n");
  const introLines: string[] = [];
  const items: FaqItem[] = [];

  let currentQuestion: string | null = null;
  let currentAnswerLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Check for H3 heading as question (### Question) or H2 (## Question)
    if (line.startsWith("### ") || (line.startsWith("## ") && (line.includes("?") || line.toLowerCase().includes("q:")))) {
      if (currentQuestion) {
        items.push({
          question: currentQuestion.replace(/^Q:\s*/i, ""),
          answerHtml: renderMarkdownToHtml(currentAnswerLines.join("\n")),
        });
        currentAnswerLines = [];
      }
      currentQuestion = line.replace(/^#{2,3}\s+/, "").trim();
      continue;
    }

    if (currentQuestion) {
      currentAnswerLines.push(rawLine);
    } else {
      introLines.push(rawLine);
    }
  }

  if (currentQuestion) {
    items.push({
      question: currentQuestion.replace(/^Q:\s*/i, ""),
      answerHtml: renderMarkdownToHtml(currentAnswerLines.join("\n")),
    });
  }

  // Fallback default items if none parsed
  if (items.length === 0) {
    items.push(
      {
        question: "Is the shipping packaging completely discreet?",
        answerHtml: renderMarkdownToHtml(
          "*(Replace with client content)*\n\nYes, absolutely. All orders arrive in plain brown cardboard boxes or opaque recyclable mailers without any brand logos, product names, or mentions of sanitary items on the outside label."
        ),
      },
      {
        question: "What makes Samaura pads gentle and breathable?",
        answerHtml: renderMarkdownToHtml(
          "*(Replace with client content)*\n\nSamaura pads use soft pure cotton topsheets and breathable plant-based backing crafted without chlorine bleach, synthetic perfumes, or harsh chemical dyes."
        ),
      },
      {
        question: "How do I choose the right menstrual cup size?",
        answerHtml: renderMarkdownToHtml(
          "*(Replace with client content)*\n\nSize S is recommended for menstruators under 25 or who have not given birth vaginally. Size M is for individuals above 25 or with regular to heavy flow. Size L is for very heavy flow or postpartum."
        ),
      },
      {
        question: "What is your return policy for hygiene items?",
        answerHtml: renderMarkdownToHtml(
          "*(Replace with client content)*\n\nIn accordance with hygiene and intimate wellness standards, opened products cannot be returned. If an item arrives damaged or defective, we provide an immediate replacement upon photo verification."
        ),
      }
    );
  }

  return {
    introHtml: renderMarkdownToHtml(introLines.join("\n")),
    items,
  };
}

export default async function FAQPage() {
  const [faqPage] = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, "faq"))
    .limit(1);

  const rawContent =
    faqPage?.content ||
    `## Frequently Asked Questions\n*(Replace with client content)*\n\n### Is the packaging completely discreet?\nAll orders arrive in plain brown boxes with confidential courier labels.\n\n### What materials are used?\nPure cotton topsheets and chlorine-free absorbent core.\n\n### What are delivery timelines?\nOrders dispatch within 24 hours. Metros take 2-3 business days.`;

  const { introHtml, items } = parseFaqContent(rawContent);

  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Answers &amp; Guidance</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink">
            {faqPage?.title || "Frequently Asked Questions"}
          </h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed">
            Everything you need to know about our products, discreet packaging guarantee, and care standards.
          </p>
        </div>

        {/* Draft Template Notice Banner */}
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs sm:text-sm shadow-xs">
          <span className="font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider shrink-0">
            Draft Template
          </span>
          <span>Replace with client content before public launch.</span>
        </div>

        {introHtml && (
          <div
            className="prose prose-sm max-w-none text-muted leading-relaxed"
            dangerouslySetInnerHTML={{ __html: introHtml }}
          />
        )}

        {/* Accordion Component */}
        <FaqAccordion items={items} />

        {/* Footer Support Banner */}
        <div className="bg-blush rounded-3xl p-8 border border-pink-light text-center space-y-4">
          <h3 className="font-heading font-bold text-lg text-ink">
            Have a question that is not listed here?
          </h3>
          <p className="text-xs text-muted max-w-md mx-auto">
            Our customer care specialists are available for confidential assistance.
          </p>
          <Link href="/contact">
            <button className="btn-brand text-xs font-semibold py-2.5 px-6 shadow-xs inline-flex items-center gap-1.5">
              Contact Helpline <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
