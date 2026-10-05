import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Truck,
  HeartHandshake,
  Lock,
  Mail,
  Phone,
  Clock,
  Sparkles,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-blush border-t border-pink-light text-ink mt-auto">
      {/* 4 Brand Pillars Band */}
      <div className="border-b border-pink-light/60 bg-white/70 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-blush/50 border border-pink-light/40">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-brand shadow-sm shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-ink">Skin-First Care</h4>
                <p className="text-xs text-muted mt-0.5">Soft organic cotton, zero harsh artificial chemicals</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-2xl bg-blush/50 border border-pink-light/40">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-brand shadow-sm shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-ink">100% Discreet Packaging</h4>
                <p className="text-xs text-muted mt-0.5">Plain exterior cardboard with zero product details</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-2xl bg-blush/50 border border-pink-light/40">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-brand shadow-sm shrink-0">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-ink">Sustainable & Mindful</h4>
                <p className="text-xs text-muted mt-0.5">Biodegradable wrappers and reusable alternatives</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-2xl bg-blush/50 border border-pink-light/40">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-brand shadow-sm shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-ink">Secure Payment & COD</h4>
                <p className="text-xs text-muted mt-0.5">UPI, cards & Cash on Delivery across India</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Intro Column */}
          <div className="lg:col-span-2 space-y-4">
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

            <p className="text-sm text-muted leading-relaxed max-w-sm">
              Samaura Healthcare is dedicated to providing Indian women with gentle, organic, and toxin-free female hygiene care. Thoughtfully designed for pure comfort, dignity, and confidence.
            </p>

            <div className="space-y-2 pt-2 text-xs text-muted">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand" />
                <a href="mailto:care@samaura.com" className="hover:text-brand transition-colors">
                  care@samaura.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand" />
                <span>WhatsApp Helpline: +91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand" />
                <span>Mon - Sat: 9:00 AM - 7:00 PM IST</span>
              </div>
            </div>
          </div>

          {/* Categories Links */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider text-ink">
              Shop Care
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/category/sanitary-pads" className="hover:text-brand transition-colors">
                  Organic Sanitary Pads
                </Link>
              </li>
              <li>
                <Link href="/category/panty-liners" className="hover:text-brand transition-colors">
                  Daily Panty Liners
                </Link>
              </li>
              <li>
                <Link href="/category/menstrual-cups" className="hover:text-brand transition-colors">
                  Medical Menstrual Cups
                </Link>
              </li>
              <li>
                <Link href="/category/intimate-care" className="hover:text-brand transition-colors">
                  pH 3.5 Intimate Washes
                </Link>
              </li>
              <li>
                <Link href="/category/wellness" className="hover:text-brand transition-colors">
                  Cramp Relief Roll-ons
                </Link>
              </li>
              <li>
                <Link href="/category/combos" className="hover:text-brand transition-colors">
                  Period Care Combos
                </Link>
              </li>
            </ul>
          </div>

          {/* Learn & Support */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider text-ink">
              Learn & Support
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/about" className="hover:text-brand transition-colors">
                  About Our Mission
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-brand transition-colors">
                  Period Health Desk (Blog)
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-brand transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-brand transition-colors">
                  Track My Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies & Legal */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider text-ink">
              Trust & Policies
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/shipping-returns" className="hover:text-brand transition-colors">
                  Shipping & Returns Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-brand transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5 text-success" />
                  Discreet Plain Packaging Guaranteed
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits & Payment Icons */}
        <div className="mt-12 pt-8 border-t border-pink-light flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted">
          <p>
            © {new Date().getFullYear()} Samaura Healthcare. All rights reserved. Handcrafted with care for feminine wellness.
          </p>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-muted">100% Encrypted & Safe Checkout:</span>
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
