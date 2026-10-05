import React from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
      <div className="w-16 h-16 rounded-full bg-blush mx-auto flex items-center justify-center text-brand border border-pink-light shadow-sm">
        <PackageSearch className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h3 className="font-heading font-bold text-xl text-ink">
          No Products Found
        </h3>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          {query
            ? `We couldn't find any products matching "${query}". Try searching for pads, menstrual cups, or liners.`
            : "No hygiene products matched your selected filters. Try clearing your filters to see all available care essentials."}
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href={resetHref}>
          <Button variant="primary" size="md">
            Clear All Filters
          </Button>
        </Link>
        <Link href="/category/sanitary-pads">
          <Button variant="secondary" size="md">
            View Sanitary Pads
          </Button>
        </Link>
      </div>
    </div>
  );
}
