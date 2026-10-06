import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Users,
  Sparkles,
  Gift,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";
import { getAllSettings } from "@/lib/services/settings";

export async function Footer() {
  const settings = await getAllSettings();

  const phone = settings.contact_phone || settings.seller_phone || "+91 6282132510";
  const email = settings.contact_email || settings.support_email || "samaurahealthcare@gmail.com";
  const whatsappNumber = (settings.whatsapp_number || "").replace(/[^0-9]/g, "");

  const instagram = (settings.social_instagram || "").trim();
  const facebook = (settings.social_facebook || "").trim();
  const linkedin = (settings.social_linkedin || "").trim();
  const hasSocials = Boolean(instagram || facebook || linkedin);

  const footerDescription =
    settings.footer_description ||
    "We are a purpose-driven startup committed to making menstrual health education accessible, inclusive, and empowering for women and young people across all sections of society.";

  return (
    <footer className="bg-blush border-t border-pink-light text-ink mt-auto">
      {/* 4 Brand Pillars Band */}
      <div className="border-b border-pink-light/60 bg-white/70 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-blush/50 border border-pink-light/40">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-ink shadow-xs shrink-0">
                <BookOpen className="w-6 h-6 text-brand" strokeWidth={1.75} />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-ink">Health Education</h4>
                <p className="text-xs text-muted mt-0.5">Age-appropriate menstrual publications</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-2xl bg-blush/50 border border-pink-light/40">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-ink shadow-xs shrink-0">
                <Users className="w-6 h-6 text-brand" strokeWidth={1.75} />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-ink">Community Awareness</h4>
                <p className="text-xs text-muted mt-0.5">Breaking stigma with confidence &amp; dignity</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-2xl bg-blush/50 border border-pink-light/40">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-ink shadow-xs shrink-0">
                <Sparkles className="w-6 h-6 text-brand" strokeWidth={1.75} />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-ink">Menstrual Cups</h4>
                <p className="text-xs text-muted mt-0.5">Informed adoption of reusable care</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-2xl bg-blush/50 border border-pink-light/40">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-ink shadow-xs shrink-0">
                <Gift className="w-6 h-6 text-brand" strokeWidth={1.75} />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-ink">Thoughtful Gifting</h4>
                <p className="text-xs text-muted mt-0.5">First-period boxes &amp; CSR partnerships</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Intro & Settings-Driven Contact Block */}
          <div className="lg:col-span-1 space-y-4">
            <Link href="/" className="inline-flex items-center">
              <div className="relative h-10 w-44">
                <Image
                  src="/samura-main-site-logo.png"
                  alt="Samaura Healthcare"
                  fill
                  sizes="176px"
                  className="object-contain object-left"
                />
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              {footerDescription}
            </p>

            <div className="space-y-2.5 pt-2 text-xs text-muted">
              {email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand shrink-0" strokeWidth={1.75} />
                  <a href={`mailto:${email}`} className="hover:text-ink transition-colors font-medium">
                    {email}
                  </a>
                </div>
              )}

              {phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand shrink-0" strokeWidth={1.75} />
                  <a href={`tel:${phone}`} className="hover:text-ink transition-colors font-medium">
                    {phone}
                  </a>
                </div>
              )}

              {whatsappNumber && (
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-ink transition-colors font-medium"
                  >
                    WhatsApp: +{whatsappNumber}
                  </a>
                </div>
              )}
            </div>

            {/* Social Icons - Hidden when all URLs are empty */}
            {hasSocials && (
              <div className="flex items-center gap-3 pt-2">
                {instagram && (
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-brand transition-colors text-xs font-semibold"
                  >
                    Instagram
                  </a>
                )}
                {facebook && (
                  <a
                    href={facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-brand transition-colors text-xs font-semibold"
                  >
                    Facebook
                  </a>
                )}
                {linkedin && (
                  <a
                    href={linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-brand transition-colors text-xs font-semibold"
                  >
                    LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Shop Column */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider text-ink">
              Shop &amp; Collections
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/category/menstrual-cups" className="hover:text-ink transition-colors">
                  Menstrual Cups
                </Link>
              </li>
              <li>
                <Link href="/gifts" className="hover:text-ink transition-colors">
                  Gift Collections
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-ink transition-colors">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Explore Column */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider text-ink">
              Explore &amp; Awareness
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/learn" className="hover:text-ink transition-colors">
                  Learn Before You Transition
                </Link>
              </li>
              <li>
                <Link href="/awareness" className="hover:text-ink transition-colors">
                  Awareness &amp; Support
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-ink transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-ink transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies & Trust */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider text-ink">
              Trust &amp; Governance
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/shipping-returns" className="hover:text-ink transition-colors">
                  Shipping &amp; Returns Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-ink transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-ink transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits & Payment Icons */}
        <div className="mt-12 pt-8 border-t border-pink-light flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted">
          <p>
            &copy; {new Date().getFullYear()} Samaura Healthcare. All rights reserved. Purpose-driven menstrual health education and hygiene solutions.
          </p>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-muted">Secure Checkout:</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-white rounded border border-pink-light font-semibold text-[10px] text-ink">
                Razorpay
              </span>
              <span className="px-2 py-0.5 bg-white rounded border border-pink-light font-semibold text-[10px] text-ink">
                UPI
              </span>
              <span className="px-2 py-0.5 bg-white rounded border border-pink-light font-semibold text-[10px] text-ink">
                Cards
              </span>
              <span className="px-2 py-0.5 bg-white rounded border border-pink-light font-semibold text-[10px] text-ink">
                COD
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
