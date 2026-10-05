"use client";

import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";

interface WhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export function WhatsAppButton({
  phoneNumber = "+919876543210",
  defaultMessage = "Hi Samaura Healthcare, I have a confidential question about your products.",
}: WhatsAppButtonProps) {
  const [showTooltip, setShowTooltip] = useState(true);

  // Clean phone number for link
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    defaultMessage
  )}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3 group">
      {/* Floating confidential help tooltip */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 bg-white text-ink text-xs font-medium py-2 px-3.5 rounded-2xl shadow-xl border border-pink-light animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span>Have a question? Chat with our team</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowTooltip(false);
            }}
            className="text-muted hover:text-brand ml-1 p-0.5"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main WhatsApp action button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#25D366]/30"
        aria-label="Chat with Samaura Healthcare on WhatsApp"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-7 h-7 fill-white/20" />
      </a>
    </div>
  );
}
