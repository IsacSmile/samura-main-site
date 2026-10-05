import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Truck } from "lucide-react";

export function AnnouncementBar() {
  return (
    <div className="bg-brand text-white text-xs py-2 px-4 font-medium transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-2 text-white/90">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>100% Rash-Free Organic Cotton</span>
        </div>

        <div className="flex-1 text-center flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-pink-light" />
          <span>
            Free 100% Discreet Shipping on orders above ₹499 | Code:{" "}
            <span className="font-bold underline tracking-wider">WELCOME15</span>
          </span>
          <Link
            href="/shop"
            className="hidden md:inline-block underline ml-2 hover:text-pink-light transition-colors"
          >
            Shop Now →
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-white/90">
          <Truck className="w-3.5 h-3.5" />
          <span>Delivered in Unmarked Packaging</span>
        </div>
      </div>
    </div>
  );
}
