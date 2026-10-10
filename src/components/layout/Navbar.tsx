"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  Search,
} from "lucide-react";
import { useCartStore } from "@/lib/cart/store";

const emptySubscribe = () => () => {};

interface NavLinkItem {
  name: string;
  href: string;
  badge?: string;
  dropdown?: { name: string; href: string; desc: string }[];
}

const NAV_LINKS: NavLinkItem[] = [
  { name: "Shop", href: "/shop" },
  {
    name: "Explore",
    href: "/learn",
    dropdown: [
      {
        name: "Learn",
        href: "/learn",
        desc: "Guidance & resources before transitioning to menstrual cups",
      },
      {
        name: "Awareness",
        href: "/awareness",
        desc: "Community awareness sessions & educational programmes",
      },
    ],
  },
  { name: "Gifts", href: "/gifts" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export interface NavbarProps {
  offersBadge?: string;
}

export function Navbar({ offersBadge = "Offers" }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartBumped, setCartBumped] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);

  const items = useCartStore((state) => state.items);
  const validItemCount = useCartStore((state) => state.validItemCount);
  const isPricingLoading = useCartStore((state) => state.isPricingLoading);
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const openCart = useCartStore((state) => state.openCart);
  const prevCountRef = useRef(cartItemCount);

  // Measure bottom edge of header into CSS variable
  const updateHeaderBottom = () => {
    if (headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect();
      const bottom = Math.round(rect.bottom);
      document.documentElement.style.setProperty("--header-bottom", `${bottom}px`);
    }
  };

  useEffect(() => {
    updateHeaderBottom();
    window.addEventListener("resize", updateHeaderBottom);
    window.addEventListener("scroll", updateHeaderBottom, { passive: true });
    return () => {
      window.removeEventListener("resize", updateHeaderBottom);
      window.removeEventListener("scroll", updateHeaderBottom);
    };
  }, []);

  // Trigger cart bump animation when item count increases
  useEffect(() => {
    if (cartItemCount > prevCountRef.current) {
      setCartBumped(true);
      const timer = setTimeout(() => setCartBumped(false), 450);
      prevCountRef.current = cartItemCount;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = cartItemCount;
  }, [cartItemCount]);

  // Route change resets mobile menu and search overlay during render
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsCategoryOpen(false);
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsCategoryOpen(false);
    document.body.style.overflow = "";
    toggleButtonRef.current?.focus();
  };

  const toggleMobileMenu = () => {
    if (!isMobileMenuOpen) {
      updateHeaderBottom();
      setIsMobileMenuOpen(true);
    } else {
      closeMobileMenu();
    }
  };

  // Handle body scroll lock & Escape / focus trap for mobile menu
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
      updateHeaderBottom();
      // Focus first interactive element inside menu
      const timer = setTimeout(() => {
        const firstFocusable = menuPanelRef.current?.querySelector<HTMLElement>(
          'input[type="text"], a[href], button:not([disabled])'
        );
        firstFocusable?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMobileMenu();
        return;
      }

      if (e.key === "Tab") {
        const panel = menuPanelRef.current;
        if (!panel) return;
        const focusable = panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const focusableArr = Array.from(focusable).filter(
          (el) => el.offsetParent !== null
        );
        if (focusableArr.length === 0) return;

        const first = focusableArr[0];
        const last = focusableArr[focusableArr.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !panel.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !panel.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  // Subtle shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className={`sticky top-0 z-header bg-white/95 backdrop-blur-md transition-all duration-300 border-b ${
          isScrolled ? "border-pink-light shadow-sm" : "border-blush"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
            {/* Mobile menu trigger */}
            <div className="flex items-center xl:hidden shrink-0">
              <button
                ref={toggleButtonRef}
                type="button"
                onClick={toggleMobileMenu}
                className="w-11 h-11 min-w-11 min-h-11 flex items-center justify-center rounded-full text-ink hover:bg-blush transition-all duration-300 focus:outline-none touch-manipulation"
                aria-label="Toggle Navigation Menu"
                aria-expanded={isMobileMenuOpen}
              >
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <Menu
                    className={`w-5 h-5 absolute inset-0 transition-all duration-300 transform ${
                      isMobileMenuOpen ? "rotate-90 opacity-0 scale-75" : "rotate-0 opacity-100 scale-100"
                    }`}
                    strokeWidth={1.75}
                  />
                  <X
                    className={`w-5 h-5 absolute inset-0 transition-all duration-300 transform ${
                      isMobileMenuOpen ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-75"
                    }`}
                    strokeWidth={1.75}
                  />
                </div>
              </button>
            </div>

            {/* Brand Logo */}
            <div className="shrink min-w-0 flex items-center overflow-hidden">
            <Link href="/" className="inline-flex items-center group min-w-0">
              <div className="relative h-8 sm:h-10 w-28 sm:w-40 transition-transform duration-300 group-hover:scale-102 shrink-0">
                <Image
                  src="/samura-main-site-logo.png"
                  alt="Samaura Healthcare"
                  fill
                  sizes="(max-width: 640px) 112px, 160px"
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation (>=1280px / xl) */}
          <nav className="hidden xl:flex items-center gap-1 xl:gap-1.5 whitespace-nowrap min-w-0">
            {NAV_LINKS.map((link) => {
              if (link.dropdown) {
                return (
                  <div
                    key={link.name}
                    className="relative group"
                    onMouseEnter={() => setIsCategoryOpen(true)}
                    onMouseLeave={() => setIsCategoryOpen(false)}
                  >
                    <button
                      className={`inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs xl:text-sm font-medium whitespace-nowrap transition-all ${
                        isCategoryOpen
                          ? "bg-blush text-ink font-semibold"
                          : "text-ink hover:bg-blush hover:text-ink-muted"
                      }`}
                    >
                      <span>{link.name}</span>
                      <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" strokeWidth={1.75} />
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute top-full left-0 w-80 sm:w-88 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 whitespace-normal">
                      <div className="bg-white rounded-3xl shadow-xl border border-pink-light p-3 space-y-1">
                        {link.dropdown.map((cat) => (
                          <Link
                            key={cat.name}
                            href={cat.href}
                            className="block p-3 rounded-2xl hover:bg-blush transition-colors group/item"
                          >
                            <div className="text-sm font-semibold text-ink group-hover/item:text-brand-dark">
                              {cat.name}
                            </div>
                            <div className="text-xs text-muted mt-0.5 leading-relaxed">
                              {cat.desc}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              const isActive = pathname === link.href;
              const badge = link.href === "/offers" ? offersBadge : link.badge;

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs xl:text-sm font-medium whitespace-nowrap transition-all relative ${
                    isActive
                      ? "bg-blush text-ink font-semibold"
                      : "text-ink hover:bg-blush hover:text-ink-muted"
                  }`}
                >
                  {link.name}
                  {badge && (
                    <span className="bg-brand text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Search Trigger */}
            <div className="relative">
              {isSearchOpen ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
                      setIsSearchOpen(false);
                    }
                  }}
                  className="hidden sm:flex items-center bg-blush border border-pink-light rounded-full px-3 py-1.5 shadow-inner"
                >
                  <Search className="w-4 h-4 text-ink-muted mr-1.5 shrink-0" strokeWidth={1.75} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cups, gifts, guides..."
                    className="bg-transparent text-xs text-ink focus:outline-none w-32 sm:w-48 placeholder:text-muted"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="text-muted hover:text-ink p-1 ml-1 touch-manipulation"
                    aria-label="Close search dropdown"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="w-11 h-11 min-w-11 min-h-11 flex items-center justify-center rounded-full text-ink hover:bg-blush transition-colors touch-manipulation"
                  title="Search products"
                  aria-label="Search products"
                >
                  <Search className="w-5 h-5" strokeWidth={1.75} />
                </button>
              )}
            </div>

            {/* Account Link */}
            <Link
              href="/account"
              className="w-11 h-11 min-w-11 min-h-11 flex items-center justify-center rounded-full text-ink hover:bg-blush transition-colors touch-manipulation"
              title="My Account"
              aria-label="My Account"
            >
              <User className="w-5 h-5" strokeWidth={1.75} />
            </Link>

            {/* Cart Button */}
            <button
              type="button"
              onClick={openCart}
              className="relative w-11 h-11 min-w-11 min-h-11 flex items-center justify-center rounded-full text-ink hover:bg-blush transition-colors group shrink-0 touch-manipulation"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag
                className={`w-5 h-5 transition-transform ${
                  cartBumped ? "animate-cart-bump" : "group-hover:scale-105"
                }`}
                strokeWidth={1.75}
              />
              {isMounted && (
                isPricingLoading && items.length > 0 && validItemCount === null ? (
                  <span className="absolute top-1 right-1 bg-brand/50 w-4 h-4 rounded-full animate-pulse shadow-xs pointer-events-none" />
                ) : (
                  cartItemCount > 0 && (
                    <span className="absolute top-1 right-1 bg-brand text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs pointer-events-none">
                      {cartItemCount > 99 ? "99+" : cartItemCount}
                    </span>
                  )
                )
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Full-Bleed Search Bar (<640px) */}
      {isSearchOpen && (
        <div className="sm:hidden absolute inset-0 bg-white z-20 px-3 flex items-center gap-2 border-b border-pink-light">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
                setIsSearchOpen(false);
              }
            }}
            className="flex-1 flex items-center bg-blush border border-pink-light rounded-full px-3 py-1.5 shadow-inner"
          >
            <Search className="w-4 h-4 text-ink-muted mr-1.5 shrink-0" strokeWidth={1.75} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cups, gifts, guides..."
              className="bg-transparent text-xs text-ink focus:outline-none w-full placeholder:text-muted"
              autoFocus
            />
          </form>
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="w-11 h-11 min-w-11 min-h-11 flex items-center justify-center rounded-full text-muted hover:text-ink touch-manipulation"
            aria-label="Close search"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>
      )}

    </header>

      {/* Mobile Menu Backdrop */}
      <div
        onClick={closeMobileMenu}
        aria-hidden="true"
        className={`xl:hidden fixed inset-x-0 bottom-0 z-drawer-backdrop bg-ink/20 backdrop-blur-xs transition-opacity duration-200 motion-reduce:transition-none ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto visible"
            : "opacity-0 pointer-events-none invisible"
        }`}
        style={{
          top: "var(--header-bottom, 64px)",
        }}
      />

      {/* Mobile Menu Overlay Panel */}
      <div
        ref={menuPanelRef}
        role="dialog"
        aria-modal={isMobileMenuOpen ? "true" : undefined}
        aria-label="Navigation Menu"
        inert={!isMobileMenuOpen}
        className={`xl:hidden fixed inset-x-0 z-drawer bg-white border-b border-pink-light overflow-y-auto transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
          isMobileMenuOpen
            ? "opacity-100 translate-y-0 visible pointer-events-auto"
            : "opacity-0 -translate-y-2 invisible pointer-events-none"
        }`}
        style={{
          top: "var(--header-bottom, 64px)",
          height: "calc(100dvh - var(--header-bottom, 64px))",
          visibility: isMobileMenuOpen ? "visible" : "hidden",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 pb-8 space-y-3">
          {/* Quick Search in Mobile Menu */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
                closeMobileMenu();
              }
            }}
            className="flex items-center bg-blush border border-pink-light rounded-2xl px-3.5 py-2.5 mb-2"
          >
            <Search className="w-4 h-4 text-ink-muted mr-2 shrink-0" strokeWidth={1.75} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menstrual cups, gifts, guides..."
              className="bg-transparent text-sm text-ink focus:outline-none w-full placeholder:text-muted"
            />
          </form>

          <Link
            href="/shop"
            onClick={closeMobileMenu}
            className="block px-3.5 py-3 rounded-2xl text-base font-semibold text-ink hover:bg-blush"
          >
            Shop
          </Link>

          <div className="pt-2 pb-1 border-t border-blush">
            <span className="px-3 text-xs font-bold uppercase tracking-wider text-muted">
              Explore
            </span>
            <div className="mt-2 space-y-1">
              <Link
                href="/learn"
                onClick={closeMobileMenu}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-ink hover:bg-blush"
              >
                Learn Before You Transition
              </Link>
              <Link
                href="/awareness"
                onClick={closeMobileMenu}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-ink hover:bg-blush"
              >
                Awareness & Support
              </Link>
            </div>
          </div>

          <div className="pt-2 border-t border-blush space-y-1">
            <Link
              href="/gifts"
              onClick={closeMobileMenu}
              className="block px-3.5 py-2.5 rounded-2xl text-sm font-medium text-ink hover:bg-blush"
            >
              Gift Collections
            </Link>
            <Link
              href="/about"
              onClick={closeMobileMenu}
              className="block px-3.5 py-2.5 rounded-2xl text-sm font-medium text-ink hover:bg-blush"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              onClick={closeMobileMenu}
              className="block px-3.5 py-2.5 rounded-2xl text-sm font-medium text-ink hover:bg-blush"
            >
              Contact
            </Link>
            <Link
              href="/account"
              onClick={closeMobileMenu}
              className="block px-3.5 py-2.5 rounded-2xl text-sm font-medium text-ink hover:bg-blush"
            >
              My Account / Orders
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
