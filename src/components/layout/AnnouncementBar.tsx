import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Truck } from "lucide-react";
import { getAllSettings } from "@/lib/services/settings";

export async function AnnouncementBar() {
  const settings = await getAllSettings();
  const leftBadge = settings.announcement_left_badge || "Menstrual Health Education & Care";
  const rightBadge = settings.announcement_right_badge || "Pan-India Delivery Available";
  const announcementText =
    settings.announcement_text || "✨ Menstrual Health Education, Awareness & Sustainable Menstrual Cups";

  return (
    <div className="bg-brand text-white text-xs h-9 py-2 px-3 sm:px-4 font-medium transition-all overflow-hidden w-full max-w-full flex items-center">
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
