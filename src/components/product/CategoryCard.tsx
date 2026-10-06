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
      className="group relative rounded-3xl overflow-hidden bg-white border border-pink-light shadow-xs hover:shadow-xl hover:border-rose transition-all duration-300 flex flex-col h-full"
    >
      {/* Separated Image Area */}
      <div className="relative w-full aspect-4/3 bg-blush/40 overflow-hidden flex items-center justify-center p-4">
        {category.image && (
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            unoptimized={category.image.endsWith(".svg")}
          />
        )}
        <span className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-ink group-hover:bg-brand group-hover:text-white transition-all shadow-xs z-10">
          <ArrowUpRight className="w-4 h-4" />
        </span>
      </div>

      {/* Separated Text Area */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-1.5 bg-white">
        <div>
          <h3 className="font-heading font-semibold text-base sm:text-lg text-ink group-hover:text-brand transition-colors leading-snug">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-xs text-muted line-clamp-2 leading-relaxed mt-1">
              {category.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
