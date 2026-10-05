import { Metadata } from "next";
import Link from "next/link";
import { Sparkles, HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Samaura Healthcare",
  description: "Common questions about discreet delivery, cotton pads, menstrual cup sizing, and returns.",
};

const FAQS = [
  {
    q: "Is the shipping packaging completely discreet?",
    a: "Yes, absolutely. All orders arrive in plain brown cardboard boxes or opaque recyclable mailers without any brand logos, product names, or mentions of sanitary items on the outside label.",
  },
  {
    q: "What makes Samaura pads so comfortable?",
    a: "Unlike conventional mass-market pads made with synthetic plastic covers, chlorine bleach, and chemical perfumes, Samaura pads use soft pure cotton topsheets and breathable plant-based backing.",
  },
  {
    q: "How do I choose the right menstrual cup size?",
    a: "Size S (Small) is recommended for menstruators under 25 or who have not given birth vaginally. Size M (Medium) is for individuals above 25 or with regular to heavy flow. Size L is for very heavy flow or postpartum.",
  },
  {
    q: "What is your return and refund policy for hygiene products?",
    a: "Due to health and hygiene safety standards, opened intimate hygiene products cannot be returned. If an item arrives damaged or defective, we provide an immediate replacement or full refund upon photo verification.",
  },
];

export default function FAQPage() {
  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Answers & Guidance</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink">
            Frequently Asked Questions
          </h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed">
            Everything you need to know about our products, discreet packaging, and care standards.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-pink-light shadow-xs space-y-2"
            >
              <h3 className="font-heading font-bold text-base sm:text-lg text-ink flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed pl-8">
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-blush rounded-3xl p-8 border border-pink-light text-center space-y-4">
          <h3 className="font-heading font-bold text-lg text-ink">
            Have a question that is not listed here?
          </h3>
          <p className="text-xs text-muted max-w-md mx-auto">
            Our customer care specialists are available on WhatsApp for confidential guidance.
          </p>
          <Link href="/contact">
            <Button size="md" className="shadow-md">
              Contact Support <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
