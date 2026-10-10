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
  alt: "Menstrual health education, community awareness, and sustainable menstrual cups by Samaura Healthcare",
  href: "/shop",
  ariaLabel: "Shop all products",
} as const;

export const SHOP_HERO_BANNER_CONFIG = {
  desktop: {
    src: "/banners/product-page-desktop-hero-image.webp",
    width: 2752,
    height: 1536,
  },
  mobile: {
    src: "/banners/product-page-mobile-hero-mobile-image.webp",
    width: 2752,
    height: 1536,
  },
  alt: "Samaura - Your Daily Comfort, Redefined. Soft pads, breathable liners, and flexible menstrual cups.",
  href: "#products-grid",
  ariaLabel: "Explore Samaura collection - Start Shopping",
} as const;
