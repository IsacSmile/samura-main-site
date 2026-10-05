import React from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { Sparkles } from "lucide-react";

export interface RelatedProductsProps {
  products: Array<React.ComponentProps<typeof ProductCard>["product"]>;
  title?: string;
  subtitle?: string;
}

export function RelatedProducts({
  products,
  title = "You May Also Like",
  subtitle = "Gentle cotton companions for your wellness routine",
}: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="space-y-6 pt-12 border-t border-blush">
      <div className="space-y-1 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Recommended Routine</span>
        </div>
        <h3 className="font-heading font-bold text-2xl sm:text-3xl text-ink">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-muted">{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
