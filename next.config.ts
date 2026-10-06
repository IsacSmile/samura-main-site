import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const hasGa = Boolean(process.env.NEXT_PUBLIC_GA_ID);

// Build Content-Security-Policy directives
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(isProduction ? [] : ["'unsafe-eval'"]),
  "https://checkout.razorpay.com",
  ...(hasGa ? ["https://www.googletagmanager.com", "https://www.google-analytics.com"] : []),
].join(" ");

const connectSrc = [
  "'self'",
  ...(isProduction ? [] : ["ws:", "wss:"]),
  "https://api.razorpay.com",
  "https://lumberjack.razorpay.com",
  ...(hasGa ? ["https://www.google-analytics.com", "https://analytics.google.com"] : []),
].join(" ");

const frameSrc = [
  "'self'",
  "https://api.razorpay.com",
  "https://checkout.razorpay.com",
].join(" ");

const cspDirectives = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https: res.cloudinary.com",
  `connect-src ${connectSrc}`,
  `frame-src ${frameSrc}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

const cspHeader = cspDirectives.join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspHeader,
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/product/organic-cotton-ultra-thin-day-pads",
        destination: "/product/pure-cotton-ultra-thin-day-pads",
        statusCode: 301,
      },
      {
        source: "/product/curved-flex-organic-cotton-liners",
        destination: "/product/curved-flex-cotton-liners",
        statusCode: 301,
      },
      {
        source: "/product/natural-period-cramp-relief-roll-on",
        destination: "/product/comfort-massage-roll-on",
        statusCode: 301,
      },
      {
        source: "/product/gentle-foaming-intimate-wash-ph-3-5",
        destination: "/product/gentle-foaming-intimate-wash",
        statusCode: 301,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/reset-password",
        headers: [
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
        ],
      },
      {
        source: "/verify-email",
        headers: [
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
