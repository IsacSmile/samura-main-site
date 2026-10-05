"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      className="flex items-center justify-center gap-1.5 sm:gap-2 mt-12"
      aria-label="Pagination Navigation"
    >
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-pink-light bg-white text-ink text-xs font-semibold hover:bg-blush transition-colors"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </Link>
      ) : (
        <span
          className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-gray-100 bg-gray-50 text-gray-400 text-xs font-semibold cursor-not-allowed"
          aria-disabled="true"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </span>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((p) => {
          const isCurrent = p === currentPage;
          return isCurrent ? (
            <span
              key={p}
              className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shadow-xs"
              aria-current="page"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={createPageUrl(p)}
              className="w-9 h-9 rounded-full border border-pink-light bg-white text-ink flex items-center justify-center text-xs font-medium hover:bg-blush transition-colors"
            >
              {p}
            </Link>
          );
        })}
      </div>

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-pink-light bg-white text-ink text-xs font-semibold hover:bg-blush transition-colors"
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span
          className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-gray-100 bg-gray-50 text-gray-400 text-xs font-semibold cursor-not-allowed"
          aria-disabled="true"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </nav>
  );
}
