import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyStateIllustration } from "@/components/ui/EmptyStateIllustration";

export interface ShopEmptyStateProps {
  resetHref?: string;
  query?: string;
}

export function ShopEmptyState({
  resetHref = "/shop",
  query,
}: ShopEmptyStateProps) {
  return (
    <div className="card-soft text-center py-16 px-6 max-w-lg mx-auto space-y-5 my-8">
      <EmptyStateIllustration type="search" className="w-24 h-24 mx-auto" />

      <div className="space-y-2">
        <h3 className="font-heading font-bold text-xl text-ink">
          No Products Found
        </h3>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          {query
            ? `We couldn't find any products matching "${query}". Try searching for menstrual cups or gift collections.`
            : "No products matched your selected filters. Try clearing your filters or exploring our collections."}
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href={resetHref}>
          <Button variant="primary" size="md">
            Clear All Filters
          </Button>
        </Link>
        <Link href="/category/menstrual-cups">
          <Button variant="secondary" size="md">
            View Menstrual Cups
          </Button>
        </Link>
      </div>
    </div>
  );
}
