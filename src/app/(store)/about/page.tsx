import { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Heart, Leaf, PackageCheck, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About Us | Samaura Healthcare",
  description: "Learn about Samaura's mission to provide gentle, skin-first, chlorine-free menstrual care with breathable comfort.",
};

const PILLARS = [
  {
    icon: Heart,
    title: "Skin-First Care",
    description: "Every product is made with soft pure cotton or biocompatible silicone. Free from artificial perfumes, harsh chlorine bleach, or artificial dyes.",
  },
  {
    icon: PackageCheck,
    title: "Discreet Delivery Guarantee",
    description: "Your privacy is sacred. All parcels are shipped in plain, unmarked recyclable boxes with confidential shipping labels to any doorstep across India.",
  },
  {
    icon: Leaf,
    title: "Eco-Conscious Chemistry",
    description: "We eliminate single-use conventional plastics in favor of plant-based cornstarch wrappers and compostable cellulose absorbent cores.",
  },
  {
    icon: ShieldCheck,
    title: "Skin-Friendly Design",
    description: "Thoughtfully selected materials prioritizing breathability, comfort, and balanced care for intimate skin.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Our Origin & Promise</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-ink leading-tight">
            Menstrual hygiene made gentle, thoughtful, and comfortable.
          </h1>
          <p className="text-muted text-base sm:text-lg leading-relaxed">
            Samaura Healthcare was founded to replace synthetic, plasticky commercial sanitary products with breathable pure cotton materials that treat your body with the kindness it deserves.
          </p>
        </div>

        {/* Brand Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="bg-white rounded-3xl p-8 border border-pink-light shadow-xs hover:shadow-md transition-all duration-300 space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-blush flex items-center justify-center text-brand">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-xl text-ink">
                  {pillar.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Story Section */}
        <div className="bg-blush rounded-3xl p-8 sm:p-12 border border-pink-light space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand">
            <span>Our Philosophy</span>
          </div>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-ink">
            No Compromises on What Touches Your Most Intimate Skin
          </h2>
          <div className="text-sm sm:text-base text-muted space-y-4 leading-relaxed">
            <p>
              Over 70% of menstruators in India experience burning, friction discomfort, or itching from mass-market plastic topsheets and chlorine-bleached wood pulp.
            </p>
            <p>
              At Samaura, every pad begins with pure cotton topsheets. We incorporate breathable botanical layers to help maintain fresh comfort naturally without artificial masking fragrances.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <Link href="/shop">
              <Button size="lg" className="w-full sm:w-auto shadow-md">
                Explore Catalog <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="blush" size="lg" className="w-full sm:w-auto">
                Talk to Our Care Team
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
