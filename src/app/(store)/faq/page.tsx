import { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowRight, HelpCircle } from "lucide-react";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { renderMarkdownToHtml } from "@/lib/markdown";
import { FaqAccordion, FaqItem } from "@/components/store/FaqAccordion";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Samaura Healthcare",
  description:
    "Find answers about Samaura Menstrual Cups, educational programmes, awareness sessions, and gift collections.",
};

function parseFaqContent(markdown: string | null | undefined): { introHtml: string; items: FaqItem[] } {
  if (!markdown || !markdown.trim()) {
    return { introHtml: "", items: [] };
  }

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

  const { introHtml, items } = parseFaqContent(faqPage?.content);

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
            Guidance and answers regarding menstrual cup transition, educational initiatives, and gift collections.
          </p>
        </div>

        {introHtml && (
          <div
            className="prose prose-sm max-w-none text-muted leading-relaxed"
            dangerouslySetInnerHTML={{ __html: introHtml }}
          />
        )}

        {/* Accordion Component or Empty Notice */}
        {items.length > 0 ? (
          <FaqAccordion items={items} />
        ) : (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-pink-light text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-blush text-brand mx-auto flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-bold text-lg text-ink">
              FAQ Guide Coming Soon
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
              Our comprehensive FAQ guide is currently being updated. If you have questions regarding menstrual cups, awareness sessions, or gift collections, please reach out directly.
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="btn-brand text-xs font-semibold py-2.5 px-6 shadow-xs inline-flex items-center gap-1.5"
              >
                <span>Ask a Question</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Footer Support Banner */}
        <div className="bg-blush rounded-3xl p-8 border border-pink-light text-center space-y-4">
          <h3 className="font-heading font-bold text-lg text-ink">
            Have a question that is not listed here?
          </h3>
          <p className="text-xs text-muted max-w-md mx-auto">
            Our team is available to assist with questions on menstrual health education, product transition, or institutional partnerships.
          </p>
          <Link href="/contact">
            <button className="btn-brand text-xs font-semibold py-2.5 px-6 shadow-xs inline-flex items-center gap-1.5">
              Contact Us <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
