"use client";

import React, { useSyncExternalStore, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryImage } from "./ProductImageGallery";

export interface ProductImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: GalleryImage[];
  activeIndex: number;
  onNavigate: (index: number) => void;
  productName: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

const emptySubscribe = () => () => {};

export function ProductImageLightbox({
  isOpen,
  onClose,
  images,
  activeIndex,
  onNavigate,
  productName,
  triggerRef,
}: ProductImageLightboxProps) {
  const pathname = usePathname();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const portalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Close on route change
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const totalImages = images.length;
  const currentImage = images[activeIndex] || images[0];

  const handlePrev = useCallback(() => {
    if (totalImages <= 1) return;
    onNavigate(activeIndex === 0 ? totalImages - 1 : activeIndex - 1);
  }, [activeIndex, totalImages, onNavigate]);

  const handleNext = useCallback(() => {
    if (totalImages <= 1) return;
    onNavigate(activeIndex === totalImages - 1 ? 0 : activeIndex + 1);
  }, [activeIndex, totalImages, onNavigate]);

  // Lock body scroll and set siblings inert while lightbox is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const triggerEl = triggerRef?.current;

    // Mark all siblings of portal inert to trap accessibility and pointer events
    const portalElement = portalRef.current;
    const inertedElements: HTMLElement[] = [];

    document.body.childNodes.forEach((node) => {
      if (node instanceof HTMLElement && node !== portalElement && !node.contains(portalElement)) {
        if (!node.hasAttribute("inert")) {
          node.setAttribute("inert", "");
          inertedElements.push(node);
        }
      }
    });

    // Move initial focus to close button
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      inertedElements.forEach((el) => {
        el.removeAttribute("inert");
      });
      // Return focus to trigger element
      triggerEl?.focus();
    };
  }, [isOpen, triggerRef]);

  // Keyboard navigation & Focus trap inside modal
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
        return;
      }

      // Focus trap
      if (e.key === "Tab" && portalRef.current) {
        const focusableElements = portalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Horizontal swipe threshold 40px, ensure horizontal intent
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  if (!isClient || !isOpen || !currentImage) {
    return null;
  }

  const lightboxContent = (
    <div
      ref={portalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Product image viewer"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-100 h-dvh w-screen bg-black/90 flex flex-col items-center justify-center select-none overflow-hidden transition-opacity duration-150 motion-reduce:transition-none animate-in fade-in-0 motion-reduce:animate-none"
      style={{
        paddingTop: "max(env(safe-area-inset-top, 16px), 16px)",
        paddingBottom: "max(env(safe-area-inset-bottom, 16px), 16px)",
        paddingLeft: "max(env(safe-area-inset-left, 16px), 16px)",
        paddingRight: "max(env(safe-area-inset-right, 16px), 16px)",
      }}
    >
      {/* Top Header Row Controls: Counter (left) & Close Button (right) */}
      <div
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-110 flex items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          id="lightbox-counter"
          className="px-3.5 py-1.5 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md text-xs sm:text-sm font-semibold tabular-nums select-none shadow-sm"
        >
          {activeIndex + 1} / {totalImages}
        </span>
      </div>

      <button
        ref={closeButtonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-110 w-11 h-11 min-w-11 min-h-11 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white border border-white/30 backdrop-blur-md transition-all focus:outline-none focus:ring-2 focus:ring-white/80 cursor-pointer shadow-lg touch-manipulation"
        aria-label="Close product image viewer"
      >
        <X className="w-5 h-5" strokeWidth={2} />
      </button>

      {/* Prev Navigation Button */}
      {totalImages > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-110 w-11 h-11 min-w-11 min-h-11 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white border border-white/30 backdrop-blur-md transition-all focus:outline-none focus:ring-2 focus:ring-white/80 cursor-pointer shadow-lg touch-manipulation"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2} />
        </button>
      )}

      {/* Next Navigation Button */}
      {totalImages > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-110 w-11 h-11 min-w-11 min-h-11 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white border border-white/30 backdrop-blur-md transition-all focus:outline-none focus:ring-2 focus:ring-white/80 cursor-pointer shadow-lg touch-manipulation"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" strokeWidth={2} />
        </button>
      )}

      {/* Center Image Container: object-contain, max-width 100vw, max-height calc(100dvh - 8rem), never cropped or covered */}
      <div
        className="relative w-full max-w-5xl h-[calc(100dvh-8rem)] flex items-center justify-center p-2 sm:p-4 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            key={currentImage.url}
            src={currentImage.url}
            alt={currentImage.alt || `${productName} view ${activeIndex + 1}`}
            fill
            priority
            sizes="100vw"
            className="object-contain select-none"
          />
        </div>
      </div>

      {/* Desktop Thumbnails Strip (Optional on desktop only) */}
      {totalImages > 1 && (
        <div
          className="hidden lg:flex fixed bottom-4 left-1/2 -translate-x-1/2 z-110 gap-2 items-center p-1.5 rounded-2xl bg-black/60 border border-white/20 backdrop-blur-md max-w-lg overflow-x-auto scrollbar-none"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => {
            const isThumbActive = idx === activeIndex;
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => onNavigate(idx)}
                className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  isThumbActive
                    ? "border-brand ring-2 ring-brand/50 scale-105 opacity-100"
                    : "border-white/30 opacity-60 hover:opacity-100"
                }`}
                aria-label={`View photo ${idx + 1}`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `${productName} thumb ${idx + 1}`}
                  fill
                  sizes="48px"
                  className="object-cover object-center"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
