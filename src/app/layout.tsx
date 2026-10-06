import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { CartDrawer } from "@/components/cart/CartDrawer";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

import { getAllSettings } from "@/lib/services/settings";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Samaura Healthcare | Pure Cotton & Gentle Female Hygiene Care",
    template: "%s | Samaura Healthcare",
  },
  description:
    "Premium, plant-derived sanitary pads, panty liners, menstrual cups, and intimate wellness products crafted for pure comfort and discreet care.",
  icons: {
    icon: "/samaura-logo.png",
  },
  keywords: [
    "sanitary pads",
    "cotton sanitary pads",
    "panty liners",
    "menstrual cups",
    "intimate hygiene wash",
    "anti-chafing pads",
    "female wellness",
    "Samaura Healthcare",
  ],
  openGraph: {
    title: "Samaura Healthcare | Pure Cotton & Gentle Female Hygiene Care",
    description:
      "Premium, plant-derived sanitary pads, panty liners, menstrual cups, and intimate wellness products.",
    url: "https://samaura.com",
    siteName: "Samaura Healthcare",
    images: [
      {
        url: "/samaura-logo.png",
        width: 800,
        height: 600,
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Samaura Healthcare | Pure Cotton & Gentle Female Hygiene Care",
    description:
      "Premium, plant-derived sanitary pads, panty liners, menstrual cups, and intimate wellness products crafted for pure comfort and discreet care.",
    images: ["/samaura-logo.png"],
  },
};

import { CookieNotice } from "@/components/common/CookieNotice";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getAllSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://samaura.com";

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Samaura Healthcare",
      url: siteUrl,
      logo: `${siteUrl}/samaura-logo.png`,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: settings.store_phone || "+91-9876543210",
        contactType: "Customer Support",
        areaServed: "IN",
        availableLanguage: ["English", "Hindi"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Samaura Healthcare",
      url: siteUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/shop?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-muted font-body selection:bg-pink-light selection:text-ink">
        <AnnouncementBar />
        <Navbar offersBadge={settings.nav_offers_badge || "Offers"} />
        <main className="flex-1 pb-12 sm:pb-16">{children}</main>
        <Footer />
        <CartDrawer />
        <WhatsAppButton />
        <CookieNotice />
      </body>
    </html>
  );
}
