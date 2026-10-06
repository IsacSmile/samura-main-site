import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { CartDrawer } from "@/components/cart/CartDrawer";

const poppins = Poppins({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

import { getAllSettings } from "@/lib/services/settings";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.samaurahealthcare.com"),
  title: {
    default: "Samaura Healthcare | Menstrual Health Education & Menstrual Cups",
    template: "%s | Samaura Healthcare",
  },
  description:
    "We are a purpose-driven startup committed to making menstrual health education accessible, inclusive, and empowering for women and young people across all sections of society.",
  icons: {
    icon: "/samaura-logo.png",
  },
  keywords: [
    "menstrual health education",
    "menstrual cups",
    "menstrual hygiene",
    "reusable menstrual hygiene",
    "first period gift box",
    "menstrual awareness",
    "Samaura Healthcare",
  ],
  openGraph: {
    title: "Samaura Healthcare | Menstrual Health Education & Menstrual Cups",
    description:
      "We are a purpose-driven startup committed to making menstrual health education accessible, inclusive, and empowering for women and young people across all sections of society.",
    url: "https://www.samaurahealthcare.com",
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
    title: "Samaura Healthcare | Menstrual Health Education & Menstrual Cups",
    description:
      "We are a purpose-driven startup committed to making menstrual health education accessible, inclusive, and empowering for women and young people across all sections of society.",
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.samaurahealthcare.com";

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Samaura Healthcare",
      description:
        "We are a purpose-driven startup committed to making menstrual health education accessible, inclusive, and empowering for women and young people across all sections of society.",
      url: siteUrl,
      logo: `${siteUrl}/samaura-logo.png`,
      email: settings.contact_email || "samaurahealthcare@gmail.com",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: settings.contact_phone || "+91 6282132510",
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
        <Navbar offersBadge={settings.nav_offers_badge || ""} />
        <main className="flex-1 pb-12 sm:pb-16">{children}</main>
        <Footer />
        <CartDrawer />
        <WhatsAppButton phoneNumber={settings.whatsapp_number} />
        <CookieNotice />
      </body>
    </html>
  );
}
