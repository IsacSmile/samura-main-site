"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Layers,
  MessageSquareCheck,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Settings,
  Users,
  Tag,
  Image as ImageIcon,
  BookOpen,
  FileText,
  Truck,
  Inbox,
  HelpCircle,
} from "lucide-react";

interface AdminSidebarProps {
  userEmail?: string | null;
  userName?: string | null;
}

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Customer Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
    exact: false,
  },
  {
    name: "Customers",
    href: "/admin/customers",
    icon: Users,
    exact: false,
  },
  {
    name: "Products & Stock",
    href: "/admin/products",
    icon: Package,
    exact: false,
  },
  {
    name: "Categories",
    href: "/admin/categories",
    icon: Layers,
    exact: false,
  },
  {
    name: "Discount Coupons",
    href: "/admin/coupons",
    icon: Tag,
    exact: false,
  },
  {
    name: "Banners & Promos",
    href: "/admin/banners",
    icon: ImageIcon,
    exact: false,
  },
  {
    name: "Health Desk Blog",
    href: "/admin/blog",
    icon: BookOpen,
    exact: false,
  },
  {
    name: "Pages CMS",
    href: "/admin/pages",
    icon: FileText,
    exact: false,
  },
  {
    name: "Shipping Rules",
    href: "/admin/shipping",
    icon: Truck,
    exact: false,
  },
  {
    name: "Customer Enquiries",
    href: "/admin/enquiries",
    icon: Inbox,
    exact: false,
  },
  {
    name: "Review Moderation",
    href: "/admin/reviews",
    icon: MessageSquareCheck,
    exact: false,
  },
  {
    name: "Customer Testimonials",
    href: "/admin/testimonials",
    icon: MessageSquareCheck,
    exact: false,
  },
  {
    name: "Settings & Store",
    href: "/admin/settings",
    icon: Settings,
    exact: false,
  },
  {
    name: "Help & Operations",
    href: "/admin/help",
    icon: HelpCircle,
    exact: false,
  },
];

export function AdminSidebar({ userEmail, userName }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Top Brand Logo */}
      <div className="p-5 pb-4 border-b border-pink-light/60 shrink-0">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="relative h-8 w-32">
              <Image
                src="/samura-main-site-logo.png"
                alt="Samaura Healthcare Admin"
                fill
                sizes="128px"
                className="object-contain object-left"
                priority
              />
            </div>
            <span className="text-[9px] uppercase font-bold tracking-wider bg-blush text-brand px-1.5 py-0.5 rounded-md border border-pink-light">
              Admin
            </span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 text-muted hover:text-ink rounded-lg cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Items - independently scrollable middle */}
      <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-1 min-h-0">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                active
                  ? "bg-brand text-white shadow-sm"
                  : "text-ink/80 hover:bg-blush hover:text-brand"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-white" : "text-brand"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile & External Links */}
      <div className="p-4 pt-3 border-t border-pink-light/70 bg-white shrink-0 space-y-3">
        <Link
          href="/shop"
          target="_blank"
          className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-ink/80 hover:text-brand hover:bg-blush transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-brand" /> View Storefront
          </span>
          <span className="text-[10px] bg-pink-light/40 px-2 py-0.5 rounded-md text-muted font-medium">
            Live
          </span>
        </Link>

        <div className="bg-blush/60 rounded-2xl p-2.5 border border-pink-light/70 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs shrink-0">
              {(userName || "A")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-ink truncate">
                {userName || "Administrator"}
              </div>
              <div className="text-[10px] text-muted truncate">
                {userEmail || "admin@example.local"}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-muted hover:text-brand rounded-lg transition-colors border border-pink-light/60 bg-white cursor-pointer"
          >
            <LogOut className="w-3 h-3" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile topbar toggle */}
      <div className="lg:hidden sticky top-0 z-sticky bg-white border-b border-pink-light px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsOpen(true)}
            className="p-1.5 text-ink hover:text-brand rounded-xl border border-pink-light cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-heading font-extrabold text-base text-ink">
            Samaura<span className="text-brand">.</span> Admin
          </span>
        </div>
        <Link
          href="/shop"
          target="_blank"
          className="text-xs font-semibold text-brand flex items-center gap-1"
        >
          Store <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-pink-light flex-col shrink-0 h-dvh sticky top-0 z-20 overflow-hidden">
        {navContent}
      </aside>

      {/* Mobile Drawer Modal */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-drawer flex">
          <div
            className="fixed inset-0 z-drawer-backdrop bg-ink/40 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 overflow-hidden">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
