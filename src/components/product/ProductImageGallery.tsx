"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ZoomIn, ChevronLeft, ChevronRight, X } from "lucide-react";

export interface GalleryImage {
  id: string;
  url: string;
  alt?: string | null;
  isPrimary?: boolean;
}

export interface ProductImageGalleryProps {
  images: GalleryImage[];
  productName: string;
  badge?: string | null;
  discountPercent?: number;
}

export function ProductImageGallery({
  images,
  productName,
  badge,
  discountPercent,
}: ProductImageGalleryProps) {
  // If no images exist, provide a fallback
  const displayImages = images.length > 0
    ? images
    : [{ id: "fallback", url: "/products/menstrual-cup.svg", alt: productName }];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [isHoverZooming, setIsHoverZooming] = useState(false);
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 });

  const activeImage = displayImages[activeIndex] || displayImages[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomCoords({ x, y });
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4 select-none">
      {/* Main Image Container */}
      <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-blush/40 border border-pink-light shadow-pink-xs group">
        {/* Floating Badges */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 items-start">
          {badge && (
            <span className="badge-brand text-xs font-bold shadow-xs">
              {badge}
            </span>
          )}
          {discountPercent && discountPercent > 0 ? (
            <span className="bg-blush text-brand border border-pink-light text-xs font-bold px-2.5 py-1 rounded-full shadow-xs">
              {discountPercent}% OFF
            </span>
          ) : null}
        </div>

        {/* Zoom Trigger Button */}
        <button
          onClick={() => setIsZoomModalOpen(true)}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/90 backdrop-blur-xs text-ink hover:text-brand border border-pink-light shadow-xs transition-all hover:scale-110 focus:outline-none"
          title="Click to view full image"
          aria-label="Zoom Image"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Interactive Hover Zoom Area */}
        <div
          className="relative w-full h-full cursor-crosshair overflow-hidden"
          onMouseEnter={() => setIsHoverZooming(true)}
          onMouseLeave={() => setIsHoverZooming(false)}
          onMouseMove={handleMouseMove}
          onClick={() => setIsZoomModalOpen(true)}
        >
          <Image
            src={activeImage.url}
            alt={activeImage.alt || productName}
            fill
            priority
            className={`object-cover object-center transition-transform duration-200 ease-out ${
              isHoverZooming ? "scale-150" : "scale-100"
            }`}
            style={
              isHoverZooming
                ? {
                    transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%`,
                  }
                : undefined
            }
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Left/Right Carousel Controls for Multi-Images */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/90 backdrop-blur-xs text-ink hover:text-brand shadow-sm border border-pink-light transition-all hover:scale-105 opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/90 backdrop-blur-xs text-ink hover:text-brand shadow-sm border border-pink-light transition-all hover:scale-105 opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {displayImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {displayImages.map((img, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={img.id || idx}
                onClick={() => setActiveIndex(idx)}
                className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 transition-all border-2 bg-blush/30 ${
                  isActive
                    ? "border-brand shadow-pink-xs ring-2 ring-brand/20 scale-105"
                    : "border-pink-light hover:border-rose opacity-70 hover:opacity-100"
                }`}
                aria-label={`View image ${idx + 1}`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `${productName} view ${idx + 1}`}
                  fill
                  className="object-cover object-center"
                  sizes="80px"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <button
            onClick={() => setIsZoomModalOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors z-50 focus:outline-none"
            aria-label="Close zoomed view"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative w-full max-w-3xl aspect-square max-h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl p-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activeImage.url}
              alt={activeImage.alt || productName}
              fill
              className="object-contain p-4"
              sizes="(max-width: 1200px) 90vw, 800px"
            />
          </div>
        </div>
      )}
    </div>
  );
}
