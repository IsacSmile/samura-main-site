import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#C8202F",
          dark: "#A31A27",
        },
        white: "#FFFFFF",
        blush: "#FFF1F4",
        pink: {
          light: "#FFD9E2",
        },
        rose: "#F5A3B7",
        ink: "#3B1F2B",
        muted: "#6B5B62",
        success: "#5BBF9F",
      },
      fontFamily: {
        heading: ["var(--font-poppins)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        "pink-sm": "0 2px 8px -1px rgba(245, 163, 183, 0.2)",
        pink: "0 4px 20px -2px rgba(245, 163, 183, 0.25)",
        "pink-lg": "0 12px 32px -4px rgba(200, 32, 47, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
