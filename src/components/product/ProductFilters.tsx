"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter, X, RotateCcw, Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface FilterCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductFiltersProps {
  categories: FilterCategory[];
  allFlowTypes: string[];
  totalProducts: number;
}

export function ProductFilters({
  categories,
  allFlowTypes,
  totalProducts,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Current URL states
  const currentCategory = searchParams.get("category") || "all";
  const currentFlow = searchParams.get("flow") || "all";
  const currentSort = searchParams.get("sort") || "newest";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const currentQ = searchParams.get("q") || "";

  // Local state for interactive mobile drawer
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [searchInput, setSearchInput] = useState(currentQ);
  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice);

  const hasActiveFilters = Boolean(
    (currentCategory && currentCategory !== "all") ||
      (currentFlow && currentFlow !== "all") ||
      currentMinPrice ||
      currentMaxPrice ||
      currentQ
  );

  // Helper to update query parameters
  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page"); // Reset to page 1 on filter change

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setMinPriceInput("");
    setMaxPriceInput("");
    router.push(pathname);
    setIsOpenMobile(false);
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({
      minPrice: minPriceInput ? minPriceInput : null,
      maxPrice: maxPriceInput ? maxPriceInput : null,
    });
    setIsOpenMobile(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ q: searchInput ? searchInput.trim() : null });
  };

  return (
    <>
      {/* Top Filter Bar (Sort, Search, Active Filter Tags, Mobile Drawer Trigger) */}
      <div className="bg-white rounded-3xl p-3.5 sm:p-5 border border-pink-light shadow-pink-xs mb-8 space-y-3.5 w-full max-w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
          {/* Search bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-full sm:max-w-md relative flex items-center min-w-0"
          >
            <Search className="w-4 h-4 text-muted absolute left-3.5 pointer-events-none shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-blush/40 hover:bg-blush/70 focus:bg-white border border-pink-light rounded-full pl-10 pr-20 py-2 text-xs sm:text-sm text-ink placeholder:text-muted/60 transition-all focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand min-w-0"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  updateQuery({ q: null });
                }}
                className="absolute right-12 text-muted hover:text-brand p-1 shrink-0"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1 bg-brand text-white rounded-full text-xs font-semibold hover:bg-brand-dark transition-colors shrink-0"
            >
              Go
            </button>
          </form>

          {/* Right: Sort Dropdown + Mobile Filter Button */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto min-w-0">
            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setIsOpenMobile(true)}
              className="lg:hidden inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border border-pink-light bg-blush text-ink text-xs font-semibold hover:bg-pink-light transition-colors min-w-0 shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand shrink-0" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
              )}
            </button>

            {/* Desktop product count */}
            <span className="hidden md:inline-block text-xs text-muted font-medium shrink-0 whitespace-nowrap">
              {totalProducts} products
            </span>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-blush/40 border border-pink-light rounded-full px-2.5 sm:px-3 py-1.5 min-w-0 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-brand shrink-0" />
              <label htmlFor="shop-sort" className="sr-only">
                Sort Products
              </label>
              <select
                id="shop-sort"
                value={currentSort}
                onChange={(e) => updateQuery({ sort: e.target.value })}
                className="bg-transparent text-xs font-semibold text-ink focus:outline-none cursor-pointer min-w-0"
              >
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
                <option value="price_asc">Price: Low-High</option>
                <option value="price_desc">Price: High-Low</option>
              </select>
            </div>
          </div>
        </div>


        {/* Quick Category Chips Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full max-w-full min-w-0">
          <button
            onClick={() => updateQuery({ category: null })}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              currentCategory === "all"
                ? "bg-brand text-white shadow-xs"
                : "bg-blush text-ink hover:bg-pink-light"
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateQuery({ category: cat.slug })}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                currentCategory === cat.slug
                  ? "bg-brand text-white shadow-xs"
                  : "bg-blush text-ink hover:bg-pink-light"
              }`}
            >
              {cat.name}
            </button>
          ))}

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-brand hover:bg-blush transition-colors ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer / Modal */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsOpenMobile(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-sm bg-white shadow-2xl p-5 sm:p-6 flex flex-col justify-between overflow-y-auto border-l border-pink-light animate-in slide-in-from-right duration-300">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-blush">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-brand" />
                    <h3 className="font-heading font-bold text-lg text-ink">
                      Filter Catalog
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsOpenMobile(false)}
                    className="p-1.5 rounded-full text-muted hover:bg-blush hover:text-brand"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Categories */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                    Categories
                  </h4>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
                      <input
                        type="radio"
                        name="mob-cat"
                        checked={currentCategory === "all"}
                        onChange={() => {
                          updateQuery({ category: null });
                          setIsOpenMobile(false);
                        }}
                        className="text-brand focus:ring-brand"
                      />
                      <span>All Categories</span>
                    </label>
                    {categories.map((cat) => (
                      <label
                        key={cat.id}
                        className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="mob-cat"
                          checked={currentCategory === cat.slug}
                          onChange={() => {
                            updateQuery({ category: cat.slug });
                            setIsOpenMobile(false);
                          }}
                          className="text-brand focus:ring-brand"
                        />
                        <span>{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Flow Types */}
                {allFlowTypes.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                      Flow &amp; Protection
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => {
                          updateQuery({ flow: null });
                          setIsOpenMobile(false);
                        }}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                          currentFlow === "all"
                            ? "bg-brand text-white"
                            : "bg-blush text-ink hover:bg-pink-light"
                        }`}
                      >
                        All Flows
                      </button>
                      {allFlowTypes.map((flow) => (
                        <button
                          key={flow}
                          onClick={() => {
                            updateQuery({ flow });
                            setIsOpenMobile(false);
                          }}
                          className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                            currentFlow === flow
                              ? "bg-brand text-white"
                              : "bg-blush text-ink hover:bg-pink-light"
                          }`}
                        >
                          {flow}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Range */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                    Price Range (₹)
                  </h4>
                  <form onSubmit={handlePriceApply} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min ₹"
                        value={minPriceInput}
                        onChange={(e) => setMinPriceInput(e.target.value)}
                        className="w-1/2 bg-blush/40 border border-pink-light rounded-xl px-3 py-1.5 text-xs text-ink"
                      />
                      <span className="text-muted text-xs">-</span>
                      <input
                        type="number"
                        placeholder="Max ₹"
                        value={maxPriceInput}
                        onChange={(e) => setMaxPriceInput(e.target.value)}
                        className="w-1/2 bg-blush/40 border border-pink-light rounded-xl px-3 py-1.5 text-xs text-ink"
                      />
                    </div>
                    <Button type="submit" size="sm" variant="secondary" className="w-full">
                      Apply Price Filter
                    </Button>
                  </form>
                </div>
              </div>

              <div className="pt-6 border-t border-blush space-y-2">
                {hasActiveFilters && (
                  <Button
                    onClick={clearAllFilters}
                    variant="ghost"
                    size="sm"
                    className="w-full text-brand"
                  >
                    Clear All Filters
                  </Button>
                )}
                <Button
                  onClick={() => setIsOpenMobile(false)}
                  variant="primary"
                  size="md"
                  className="w-full"
                >
                  View {totalProducts} Products
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
