"use client";

import React, { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

export function Reveal({ children, className = "", delayMs = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    // If user prefers reduced motion, keep static
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) {
        return;
      }
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      return;
    }

    // Set shouldAnimate to true now that client JS is running and motion is allowed
    setShouldAnimate(true);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasAnimated(true);
            observer.unobserve(entry.target);
          }
        }
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -20px 0px",
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  // When JS is disabled or during SSR or under prefers-reduced-motion:
  // shouldAnimate is false, so it renders fully visible with no transform/animation classes.
  // When active in browser: animates once into view over 300ms.
  const isHidden = shouldAnimate && !hasAnimated;

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: shouldAnimate ? "300ms" : "0ms",
        transitionDelay: `${delayMs}ms`,
      }}
      className={`transition-[opacity,transform] ease-out ${
        isHidden ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
