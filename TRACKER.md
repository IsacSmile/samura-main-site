# Samaura Healthcare — Implementation Tracker

Living tracker for the production-grade e-commerce web application for **Samaura Healthcare** (female hygiene products brand).
Last updated: Phase 1 (Foundation) Complete.

---

## Phase Status Overview

| Phase | Description | Status | Verification |
|---|---|---|---|
| **Phase 1: Foundation** | Next.js 16 + TS + Tailwind tokens & fonts + ESLint + Prettier + strict folder structure + 17 Drizzle tables & migrations + Seed (4 categories, 8 products, 2 coupons, 1 admin) + Base UI Kit (Button, Input, Select, Badge, Card, Modal, Toast, Skeleton) + Responsive Layout (Sticky Header with Search/Cart/Account, Drawer Nav, Footer, Announcement Bar, Floating WhatsApp) + TRACKER.md + .env.example | **DONE** | `npm run lint` (0 errors) • `npx tsc --noEmit` (0 errors) • `npm run build` (Passed) |
| **Phase 2: Storefront Catalog** | Applied Fixes A-D (env seed with bcrypt, Turso/local DB toggle, migration 0001 with ingredients/absorption/usage guide + reviews table, gitignore data/*.db). Built `/shop`, `/category/[slug]`, `/product/[slug]`, reusable `ProductCard`, money formatting `formatRupees`, SVG placeholder images, JSON-LD Product schema, approved reviews with moderation API, dynamic filters & pagination. | **DONE** | `npm run lint` (0 errors) • `npx tsc --noEmit` (0 errors) • `npm run build` (Passed) • Verified HTTP 200 SSR on all catalog routes |
| **Phase 3: Cart & Checkout Engine** | Cart page & drawer, persisted Zustand sync, coupon application, Zod checkout validation, and atomic stock lock + order transaction | *Next* | To build |
| **Phase 4: Payments & Transactions** | Razorpay (cards/UPI/netbanking) + COD + idempotent server webhook signature verification + Resend email confirmations | *Pending* | To build |
| **Phase 5: Customer Account** | Profile, saved addresses, order tracking history, and detailed receipts | *Pending* | To build |
| **Phase 6: Content & Support** | About Us, Period Guide / Blog (list + reader), FAQ accordion, Contact enquiry form | *Pending* | To build |
| **Phase 7: Admin Dashboard (/admin)** | Products & variants, orders + printable invoice, categories, coupons, banners, blog, pages, shipping rules, settings | *Pending* | To build |

---

## Detailed Phase 1 Checklist (Definition of Done)

### 1. Tooling & Design System
- [x] Next.js 16 (App Router) + TypeScript strict mode
- [x] Tailwind CSS configured with exact brand tokens:
  - `brand.DEFAULT #C8202F`, `brand.dark #A31A27`
  - `white #FFFFFF`, `blush #FFF1F4`, `pink.light #FFD9E2`, `rose #F5A3B7`
  - `ink #3B1F2B` (headings), `muted #6B5B62` (body), `success #5BBF9F`
- [x] Brand typography: Poppins (headings), Inter (body)
- [x] Prettier (`.prettierrc`) + ESLint (`eslint.config.mjs`) configured
- [x] Logo asset copied to `/public/samaura-logo.png`

### 2. Folder Structure
- [x] `src/app/(store)`
- [x] `src/app/(account)`
- [x] `src/app/admin`
- [x] `src/app/api`
- [x] `src/components/ui`
- [x] `src/components/layout`
- [x] `src/components/product`
- [x] `src/components/cart`
- [x] `src/components/admin`
- [x] `src/db/schema`
- [x] `src/db/migrations`
- [x] `src/db/seed`
- [x] `src/lib/auth`
- [x] `src/lib/razorpay`
- [x] `src/lib/email`
- [x] `src/lib/validators`
- [x] `src/lib/utils`
- [x] `src/lib/storage`
- [x] `src/store`
- [x] `src/types`

### 3. Database & Drizzle Schema (17 Tables)
- [x] `users` (credentials, roles: customer, admin)
- [x] `addresses` (shipping addresses linked to users)
- [x] `categories` (with `parent_id` support for hierarchical subcategories)
- [x] `products` (slug, paise prices, flow types, highlights, FAQs)
- [x] `product_variants` (size, packQty, SKU, pricePaise, salePricePaise, stock)
- [x] `product_images` (url, alt, isPrimary, sortOrder)
- [x] `carts` (server-persisted cart storage)
- [x] `orders` (orderNumber, status, paymentMethod, paymentStatus, paise totals)
- [x] `order_items` (snapshot of name, variant, sku, pricePaise, quantity)
- [x] `payments` (gateway, transactionId, signature, status, paise amount)
- [x] `coupons` (percentage / fixed_paise, minOrderPaise, usage limit)
- [x] `banners` (hero & promo banners)
- [x] `posts` (blog articles)
- [x] `pages` (static CMS content)
- [x] `settings` (key-value store configuration)
- [x] `shipping_rules` (tiered shipping rules & thresholds)
- [x] `enquiries` (customer messages & support tickets)
- [x] Migrations generated (`src/db/migrations/0000_petite_makkari.sql`) and applied to SQLite database
- [x] Database seed executed (`src/db/seed/index.ts`):
  - 4 categories: Sanitary Pads, Panty Liners, Menstrual Cups, Intimate Care
  - 8 demo products with variants (size, pack count, stock, paise prices)
  - 2 coupons: `WELCOME15` (15% off), `SAMAURA10` (10% off)
  - 1 admin user: `admin@samaura.com` (`Admin@123456`) + demo customer `priya@example.com`

### 4. Base UI Kit (`src/components/ui/`)
- [x] `Button` (pill, variants: primary / secondary / ghost / blush / outline, sizes: sm/md/lg, loading spinner)
- [x] `Input` (accessible label, error states, left/right icon slots, blush tint)
- [x] `Select` (accessible label, custom dropdown arrow, error states)
- [x] `Badge` (pill radius, variants: brand / blush / success / outline / muted)
- [x] `Card` (rounded-3xl, soft pink-tinted shadows, subtle borders)
- [x] `Modal` (accessible backdrop dialog, escape key listener, smooth animations)
- [x] `Toast` (success / error / info alert banners with auto-dismiss timer)
- [x] `Skeleton` (soft blush pulse placeholders for text, cards, and avatars)

### 5. Layout & Core Navigation
- [x] Sticky Header (`Navbar.tsx`):
  - Brand logo with hover animation
  - Interactive Search expander input
  - Category dropdown menu
  - Cart button with dynamic counter badge (linked to Zustand store)
  - Account button
- [x] Mobile Drawer Navigation:
  - Slide-down/slide-over menu with category links, offers, contact, and account
  - Auto-close on link navigation
- [x] Announcement Bar (`AnnouncementBar.tsx`):
  - Free-shipping banner text + active promo code badge (`WELCOME15`)
- [x] Footer (`Footer.tsx`):
  - 4 brand pillars: 100% Skin First, Discreet Packaging, Sustainable, Secure Payment
  - Navigation links, trust badges, payment gateways, and contact info
- [x] WhatsApp Floating Button (`WhatsAppButton.tsx`):
  - Confidential customer helpline click-to-chat button with dismissible tooltip

### 6. Environment & Configuration
- [x] `.env.example` created with all configuration keys
- [x] `.env` development configuration created
- [x] `.gitignore` updated to protect secrets and SQLite database files

---

## Detailed Phase 2 Checklist (Definition of Done)

### 1. Mandatory Fixes A–D
- [x] **Fix A: Seed Env & Bcrypt Security**:
  - `src/db/seed/index.ts` reads `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` from environment variables with safe dev fallbacks.
  - Demo customer `Priya Sharma` is strictly guarded by `process.env.NODE_ENV !== "production"`.
  - Passwords securely hashed with `bcryptjs`.
- [x] **Fix B: DB Client Dialect Flexibility**:
  - `drizzle.config.ts` dynamically selects `dialect: "turso"` when `DATABASE_AUTH_TOKEN` is present, or `dialect: "sqlite"` for local files (`file:data/samaura.db`).
  - Documented local and Turso configurations in `.env.example` and `.env`.
- [x] **Fix C: Schema Extensions & Migration 0001**:
  - Added `ingredients`, `absorptionGuide`, and `usageGuide` to `products` table in `src/db/schema/index.ts`.
  - Created full `reviews` table (`id`, `productId`, `userId`, `userName`, `rating`, `title`, `body`, `status`, `isVerified`, `createdAt`) with Drizzle relations.
  - Generated new migration `src/db/migrations/0001_oval_susan_delgado.sql` leaving `0000_petite_makkari.sql` untouched.
  - Executed migration and verified columns exist in `data/samaura.db`.
- [x] **Fix D: Gitignore Protection**:
  - Confirmed `data/*.db`, `data/*.db-journal`, and `uploads/` are completely ignored in `.gitignore`.

### 2. Storefront Catalog Features
- [x] **Money Formatting Helper (`src/lib/utils/money.ts`)**:
  - `formatRupees`: Converts integer paise to ₹ with standard Indian numbering grouping (`en-IN`), e.g., 29900 paise -> `₹299`.
  - `calculateDiscountPercent`: Integer percentage discount calculation.
- [x] **Placeholder Product Images (`/public/products/`)**:
  - 8 aesthetic, brand-tailored vector SVG images: `day-pads.svg`, `overnight-pads.svg`, `daily-liners.svg`, `curved-liners.svg`, `menstrual-cup.svg`, `cup-sterilizer.svg`, `intimate-wash.svg`, `cramp-rollon.svg`.
  - Discreet, non-explicit packaging designs matching the blush/rose palette.
- [x] **Reusable ProductCard (`src/components/product/ProductCard.tsx`)**:
  - Aspect-ratio image with hover zoom effect and fallback placeholders.
  - Brand red discount badge (`X% OFF`), bestseller/feature chip, flow type badge.
  - Formatted rupee prices from integer paise.
  - Quick "Add to Bag" button wired directly to the persisted Zustand cart store (`useCartStore`).
- [x] **Shop Page (`/shop`)**:
  - Server-rendered product grid with pagination (12 items per page).
  - URL-param reactive filters: Category, Flow Type (Regular, Heavy, Overnight, Daily, Light), Min/Max Price range (converted to paise on the server).
  - Sort options: Newest First, Price: Low to High, Price: High to Low, Most Popular.
  - Search query via `?q=` searching title, short description, long description, and ingredients.
  - Accessible mobile filter drawer dialog for 375px screens.
  - Empty state (`ShopEmptyState.tsx`) with "Clear All Filters" button.
  - Skeleton loading view (`src/app/(store)/shop/loading.tsx`).
- [x] **Category Drilldown (`/category/[slug]`)**:
  - Scoped catalog view for each category with hero banner and description.
  - Subcategory & sibling navigation pill chips.
  - Dynamic SEO metadata via `generateMetadata()`.
  - Breadcrumb navigation with schema microdata.
- [x] **Product Detail Page (`/product/[slug]`)**:
  - Interactive image gallery (`ProductImageGallery.tsx`) with thumbnail selector, hover magnifying zoom, and full-screen lightbox modal.
  - Variant selector (`ProductVariantSelector.tsx`) for size/pack options:
    - Real-time price and sale price updates.
    - Stock state indicators: "In Stock" (green), "Low Stock: Only X left" (amber), or "Out of Stock" (red).
    - Quantity stepper with min/max stock limits.
    - "Add to Bag" and "Buy Now" buttons wired to Zustand cart store, disabled when out of stock.
  - Product specifications accordion (`ProductAccordion.tsx`):
    - Absorption & Flow Guide.
    - 100% Certified Ingredients (toxin-free, chlorine-free, rash-free).
    - Usage, Application & Safe Disposal guidelines.
    - Frequently Asked Questions (FAQ).
  - Verified Customer Reviews (`ProductReviews.tsx`):
    - Ratings breakdown scorecard with 5-star summary.
    - Authentic review list filtered strictly to `status: "approved"`.
    - Honest "No reviews yet" state when a product has 0 approved reviews (never fake data).
    - Customer review submission modal connected to `/api/reviews` (saving as `status: "pending"` for moderation).
  - Related products recommendation carousel/grid.
  - JSON-LD Product schema script for search engines.
  - Dynamic SEO `generateMetadata()`.

### 3. Verification & Definition of Done
- [x] **ESLint Check**: `npm run lint` -> Passed with 0 errors and 0 warnings.
- [x] **Typecheck**: `npx tsc --noEmit` -> Passed with 0 errors.
- [x] **Production Build**: `npm run build` -> Compiled all routes cleanly with Next.js Turbopack.
- [x] **Server Health**: Production server running on `http://localhost:3000`.
- [x] **Catalog SSR Endpoints**:
  - `GET /shop` -> HTTP 200
  - `GET /category/sanitary-pads` -> HTTP 200
  - `GET /product/organic-cotton-ultra-thin-day-pads` -> HTTP 200
  - `POST /api/reviews` -> HTTP 200 (pending review moderation)

