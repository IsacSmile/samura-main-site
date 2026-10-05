import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ShopLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header skeleton */}
      <div className="space-y-3 max-w-xl">
        <Skeleton variant="text" className="w-32 h-6 rounded-full" />
        <Skeleton variant="text" className="w-64 h-9" />
        <Skeleton variant="text" className="w-full h-4" />
      </div>

      {/* Top Filter Bar skeleton */}
      <div className="bg-white rounded-3xl p-5 border border-pink-light/70 shadow-pink-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Skeleton variant="rounded" className="h-10 w-full sm:w-80 rounded-full" />
          <Skeleton variant="rounded" className="h-10 w-44 rounded-full" />
        </div>
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rounded" className="h-8 w-24 rounded-full shrink-0" />
          ))}
        </div>
      </div>

      {/* Products Grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="card-soft p-4 sm:p-5 space-y-4 flex flex-col justify-between"
          >
            <Skeleton variant="rounded" className="w-full aspect-square rounded-2xl" />
            <div className="space-y-2">
              <Skeleton variant="text" className="w-20 h-4 rounded-full" />
              <Skeleton variant="text" className="w-full h-5" />
              <Skeleton variant="text" className="w-3/4 h-3" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Skeleton variant="text" className="w-24 h-6" />
              <Skeleton variant="circular" className="w-9 h-9 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
