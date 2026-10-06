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

  const cartItemCount = useCartStore((state) => state.getItemCount());
  const openCart = useCartStore((state) => state.openCart);
  const prevCountRef = useRef(cartItemCount);

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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsCategoryOpen(false);
  };

  // Subtle shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md transition-all duration-300 border-b ${
        isScrolled ? "border-pink-light shadow-sm" : "border-blush"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Mobile menu trigger */}
          <div className="flex items-center xl:hidden shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-11 h-11 min-w-11 min-h-11 flex items-center justify-center rounded-full text-ink hover:bg-blush transition-all duration-300 focus:outline-none"
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
          <div className="shrink min-w-0 flex items-center">
            <Link href="/" className="inline-flex items-center group min-w-0">
              <div className="relative h-8 sm:h-10 w-32 sm:w-40 transition-transform duration-300 group-hover:scale-102 shrink-0">
                <Image
                  src="/samura-main-site-logo.png"
                  alt="Samaura Healthcare"
                  fill
                  sizes="(max-width: 640px) 128px, 160px"
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
                  className="flex items-center bg-blush border border-pink-light rounded-full px-3 py-1.5 shadow-inner"
                >
                  <Search className="w-4 h-4 text-ink-muted mr-1.5 shrink-0" strokeWidth={1.75} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search pads, cups..."
                    className="bg-transparent text-xs text-ink focus:outline-none w-32 sm:w-48 placeholder:text-muted"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="text-muted hover:text-ink p-1 ml-1"
                    aria-label="Close search"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="w-11 h-11 min-w-11 min-h-11 flex items-center justify-center rounded-full text-ink hover:bg-blush transition-colors"
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
              className="w-11 h-11 min-w-11 min-h-11 flex items-center justify-center rounded-full text-ink hover:bg-blush transition-colors"
              title="My Account"
              aria-label="My Account"
            >
              <User className="w-5 h-5" strokeWidth={1.75} />
            </Link>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="relative w-11 h-11 min-w-11 min-h-11 flex items-center justify-center rounded-full text-ink hover:bg-blush transition-colors group shrink-0"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag
                className={`w-5 h-5 transition-transform ${
                  cartBumped ? "animate-cart-bump" : "group-hover:scale-105"
                }`}
                strokeWidth={1.75}
              />
              {isMounted && cartItemCount > 0 && (
                <span className="absolute top-1 right-1 bg-brand text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs pointer-events-none">
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </span>
              )}
            </button>


          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (<1280px / xl) */}
      <div
        className={`xl:hidden grid transition-all duration-300 ease-in-out bg-white border-pink-light ${
          isMobileMenuOpen
            ? "grid-rows-[1fr] opacity-100 border-t pt-4 pb-6 px-4"
            : "grid-rows-[0fr] opacity-0 border-t-0 pt-0 pb-0 px-4 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden min-h-0 space-y-2">
          <div className="max-h-[calc(100vh-6rem)] overflow-y-auto space-y-2 pr-0.5">
            {/* Quick Search in Mobile Menu */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
                  closeMobileMenu();
                }
              }}
              className="flex items-center bg-blush border border-pink-light rounded-2xl px-3.5 py-2.5 mb-3"
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
      </div>
    </header>
  );
}
