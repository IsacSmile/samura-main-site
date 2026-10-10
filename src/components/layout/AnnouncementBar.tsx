import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Truck } from "lucide-react";
import { getAllSettings } from "@/lib/services/settings";

function stripEmojis(text: string): string {
  if (!text) return "";
  return text
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/[\uFE00-\uFE0F\u200D\u20E3]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function AnnouncementBar() {
  const settings = await getAllSettings();
  const leftBadge = stripEmojis(settings.announcement_left_badge || "Menstrual Health Education & Care");
  const rightBadge = stripEmojis(settings.announcement_right_badge || "Pan-India Delivery Available");
  const rawAnnouncementText =
    settings.announcement_text || "✨ Menstrual Health Education, Awareness & Sustainable Menstrual Cups";
  const announcementText = stripEmojis(rawAnnouncementText);

  return (
    <div className="bg-brand text-white text-xs h-9 py-2 px-3 sm:px-4 font-medium transition-all overflow-hidden w-full max-w-full flex items-center relative z-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-hidden w-full">
        {leftBadge && (
          <div className="hidden lg:flex items-center gap-1.5 text-white/90 shrink-0 truncate max-w-xs">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-pink-light" />
            <span className="truncate">{leftBadge}</span>
          </div>
        )}

        <div className="flex-1 text-center flex items-center justify-center gap-1.5 sm:gap-2 overflow-hidden min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-pink-light shrink-0" />
          <span className="truncate text-[11px] sm:text-xs">
            {announcementText}
          </span>
          <Link
            href="/shop"
            className="hidden sm:inline-block underline ml-1 hover:text-pink-light transition-colors shrink-0"
          >
            Shop Now →
          </Link>
        </div>

        {rightBadge && (
          <div className="hidden lg:flex items-center gap-1.5 text-white/90 shrink-0 truncate max-w-xs">
            <Truck className="w-3.5 h-3.5 shrink-0 text-pink-light" />
            <span className="truncate">{rightBadge}</span>
          </div>
        )}
      </div>
    </div>
  );
}
