import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

export interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    image?: string | null;
  };
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative rounded-3xl overflow-hidden bg-white border border-pink-light shadow-sm hover:shadow-xl hover:border-rose transition-all duration-300 p-5 flex flex-col justify-between aspect-square"
    >
      {/* Background Image with soft gradient overlay */}
      <div className="absolute inset-0 z-0 bg-blush">
        {category.image && (
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover object-center opacity-85 group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-white via-white/80 to-transparent" />
      </div>

      {/* Top action badge */}
      <div className="relative z-10 self-end">
        <span className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-ink group-hover:bg-brand group-hover:text-white transition-all shadow-xs">
          <ArrowUpRight className="w-4 h-4" />
        </span>
      </div>

      {/* Bottom Content */}
      <div className="relative z-10 space-y-1">
        <h3 className="font-heading font-semibold text-base sm:text-lg text-ink group-hover:text-brand transition-colors leading-snug">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-xs text-muted line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        )}
      </div>
    </Link>
  );
}
