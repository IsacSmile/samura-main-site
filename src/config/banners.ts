/**
 * Hero Banner configuration and image asset paths.
 * Allows easy swapping of storefront hero assets across breakpoints.
 */
export const HERO_BANNER_CONFIG = {
  desktop: {
    src: "/banners/desktop-hero-banner.webp",
    width: 2728,
    height: 1536,
  },
  mobile: {
    src: "/banners/mobile-hero-banner.webp",
    width: 1536,
    height: 2728,
  },
  alt: "Introducing comfortable personal care with ultra-soft pads, liners, and flexible cups by Samaura Healthcare",
  href: "/shop",
  ariaLabel: "Shop all products",
} as const;
