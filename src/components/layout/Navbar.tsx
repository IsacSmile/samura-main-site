"use client";

import React, { useState, useEffect } from "react";
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

const NAV_LINKS = [
  { name: "Shop All", href: "/shop" },
  {
    name: "Categories",
    href: "/shop",
    dropdown: [
      { name: "Sanitary Pads", href: "/category/sanitary-pads", desc: "Day & night organic rash-free pads" },
      { name: "Panty Liners", href: "/category/panty-liners", desc: "Everyday freshness & spotting care" },
      { name: "Menstrual Cups", href: "/category/menstrual-cups", desc: "12-hour reusable medical silicone" },
      { name: "Intimate Hygiene", href: "/category/intimate-hygiene", desc: "pH 3.5 soothing washes & wipes" },
      { name: "Period Wellness", href: "/category/wellness", desc: "Cramp relief roll-ons & herbal care" },
      { name: "Combos & Kits", href: "/category/combos", desc: "Starter kits with canvas travel pouch" },
    ],
  },
  { name: "Offers & Bundles", href: "/offers", badge: "Save 20%" },
  { name: "About Us", href: "/about" },
  { name: "Period Guide", href: "/blog" },
  { name: "Contact", href: "/contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const cartItemCount = useCartStore((state) => state.getItemCount());
  const openCart = useCartStore((state) => state.openCart);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsCategoryOpen(false);
  };

  // Handle subtle shadow on scroll
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
        <div className="flex items-center justify-between h-20">
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-full text-ink hover:bg-blush transition-colors focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Brand Logo */}
          <div className="shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-blush p-1 border border-pink-light transition-transform duration-300 group-hover:scale-105 shadow-sm">
                <Image
                  src="/samaura-logo.png"
                  alt="Samaura Healthcare Logo"
                  fill
                  className="object-contain p-1"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold text-xl md:text-2xl text-ink tracking-tight group-hover:text-brand transition-colors">
                  Samaura<span className="text-brand">.</span>
                </span>
                <span className="text-[10px] tracking-wider uppercase text-muted -mt-1 font-medium">
                  Healthcare & Hygiene
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
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
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                        isCategoryOpen
                          ? "bg-blush text-brand"
                          : "text-ink hover:bg-blush hover:text-brand"
                      }`}
                    >
                      <span>{link.name}</span>
                      <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute top-full left-0 w-80 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200">
                      <div className="bg-white rounded-2xl shadow-xl border border-pink-light p-3 space-y-1">
                        {link.dropdown.map((cat) => (
                          <Link
                            key={cat.name}
                            href={cat.href}
                            className="block p-2.5 rounded-xl hover:bg-blush transition-colors group/item"
                          >
                            <div className="text-sm font-semibold text-ink group-hover/item:text-brand">
                              {cat.name}
                            </div>
                            <div className="text-xs text-muted mt-0.5">
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

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all relative ${
                    isActive
                      ? "bg-blush text-brand font-semibold"
                      : "text-ink hover:bg-blush hover:text-brand"
                  }`}
                >
                  {link.name}
                  {link.badge && (
                    <span className="bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-1 animate-pulse">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3">
            {/* Search Trigger / Input */}
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
                  <Search className="w-4 h-4 text-brand mr-2 shrink-0" />
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
                    className="text-muted hover:text-brand p-0.5 ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2.5 rounded-full text-ink hover:bg-blush hover:text-brand transition-colors"
                  title="Search products"
                  aria-label="Search products"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Account Link */}
            <Link
              href="/account"
              className="p-2.5 rounded-full text-ink hover:bg-blush hover:text-brand transition-colors"
              title="My Account"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="relative inline-flex items-center justify-center p-2.5 rounded-full text-ink hover:bg-blush hover:text-brand transition-colors group"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 transition-transform group-hover:scale-110" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50 duration-200">
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </span>
              )}
            </button>

            {/* Quick Shop Button (Desktop) */}
            <Link
              href="/shop"
              className="hidden sm:inline-flex btn-brand text-xs font-medium py-2 px-4 shadow-sm"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-pink-light bg-white px-4 pt-4 pb-6 space-y-2 animate-in slide-in-from-top-4 duration-200">
          <Link
            href="/shop"
            onClick={closeMobileMenu}
            className="block px-3 py-2.5 rounded-xl text-base font-medium text-ink hover:bg-blush hover:text-brand"
          >
            Shop All Products
          </Link>

          <div className="pt-2 pb-1 border-t border-blush">
            <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Categories
            </span>
            <div className="mt-1 grid grid-cols-2 gap-1">
              <Link
                href="/category/sanitary-pads"
                onClick={closeMobileMenu}
                className="px-3 py-2 rounded-xl text-sm text-ink hover:bg-blush"
              >
                Sanitary Pads
              </Link>
              <Link
                href="/category/panty-liners"
                onClick={closeMobileMenu}
                className="px-3 py-2 rounded-xl text-sm text-ink hover:bg-blush"
              >
                Panty Liners
              </Link>
              <Link
                href="/category/menstrual-cups"
                onClick={closeMobileMenu}
                className="px-3 py-2 rounded-xl text-sm text-ink hover:bg-blush"
              >
                Menstrual Cups
              </Link>
              <Link
                href="/category/intimate-hygiene"
                onClick={closeMobileMenu}
                className="px-3 py-2 rounded-xl text-sm text-ink hover:bg-blush"
              >
                Intimate Hygiene
              </Link>
              <Link
                href="/category/wellness"
                onClick={closeMobileMenu}
                className="px-3 py-2 rounded-xl text-sm text-ink hover:bg-blush"
              >
                Period Wellness
              </Link>
              <Link
                href="/category/combos"
                onClick={closeMobileMenu}
                className="px-3 py-2 rounded-xl text-sm text-ink hover:bg-blush"
              >
                Combos & Kits
              </Link>
            </div>
          </div>

          <div className="pt-2 border-t border-blush space-y-1">
            <Link
              href="/offers"
              onClick={closeMobileMenu}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-brand bg-blush"
            >
              <span>Offers & Value Packs</span>
              <span className="bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </Link>
            <Link
              href="/about"
              onClick={closeMobileMenu}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-ink hover:bg-blush"
            >
              About Samaura
            </Link>
            <Link
              href="/blog"
              onClick={closeMobileMenu}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-ink hover:bg-blush"
            >
              Period Guide & Blog
            </Link>
            <Link
              href="/contact"
              onClick={closeMobileMenu}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-ink hover:bg-blush"
            >
              Contact & Helpline
            </Link>
            <Link
              href="/account"
              onClick={closeMobileMenu}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-ink hover:bg-blush"
            >
              My Account / Orders
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
