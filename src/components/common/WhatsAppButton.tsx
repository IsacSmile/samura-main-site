"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";

interface WhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export function WhatsAppButton({
  phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  defaultMessage = "Hi Samaura Healthcare, I have an enquiry regarding menstrual health and hygiene products.",
}: WhatsAppButtonProps) {
  const [showTooltip, setShowTooltip] = useState(true);
  const pathname = usePathname();

  // Hide when phone number is empty / unconfirmed
  const cleanPhone = (phoneNumber || "").replace(/[^0-9]/g, "");
  if (!cleanPhone) {
    return null;
  }

  // Hide on checkout and cart pages to avoid distracting from conversion or overlapping action buttons
  if (pathname && (pathname.startsWith("/checkout") || pathname.startsWith("/cart"))) {
    return null;
  }

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    defaultMessage
  )}`;

  const isProductPage = Boolean(pathname?.startsWith("/product/"));

  return (
    <div
      className={`fixed right-4 z-40 flex items-end gap-2.5 max-w-[calc(100vw-2rem)] pointer-events-none ${
        isProductPage ? "bottom-20 sm:bottom-4" : "bottom-4"
      }`}
    >
      {/* Floating confidential help tooltip - hidden on mobile screens */}
      {showTooltip && (
        <div className="hidden md:flex items-center gap-2 bg-white text-ink text-xs font-medium py-2 px-3.5 rounded-2xl shadow-xl border border-pink-light pointer-events-auto max-w-[calc(100vw-6rem)] animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
          <span className="truncate">Have a question? Chat with our team</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowTooltip(false);
            }}
            className="text-muted hover:text-brand ml-1 p-0.5 shrink-0"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main WhatsApp action button: strictly 48px (w-12 h-12) */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 shrink-0 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#25D366]/30 pointer-events-auto"
        aria-label="Chat with Samaura Healthcare on WhatsApp"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-white/20" />
      </a>
    </div>
  );
}
