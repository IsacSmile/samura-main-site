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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Samaura Healthcare | Organic & Gentle Female Hygiene Products",
    template: "%s | Samaura Healthcare",
  },
  description:
    "Premium, chemical-free sanitary pads, panty liners, menstrual cups, and intimate wellness products crafted for pure comfort and discreet care.",
  icons: {
    icon: "/samaura-logo.png",
  },
  keywords: [
    "sanitary pads",
    "organic cotton pads",
    "panty liners",
    "menstrual cups",
    "intimate hygiene wash",
    "rash free pads",
    "female wellness",
    "Samaura Healthcare",
  ],
  openGraph: {
    title: "Samaura Healthcare | Organic & Gentle Female Hygiene Products",
    description:
      "Premium, chemical-free sanitary pads, panty liners, menstrual cups, and intimate wellness products.",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-muted font-body selection:bg-pink-light selection:text-ink">
        <AnnouncementBar />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
