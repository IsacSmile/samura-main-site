# Samaura Healthcare — Implementation Tracker

Living tracker for the production-grade e-commerce web application for **Samaura Healthcare** (female hygiene products brand).
Last updated: Phase 1 (Foundation) Complete.

---

## Phase Status Overview

| Phase | Description | Status | Verification |
|---|---|---|---|
| **Phase 1: Foundation** | Next.js 16 + TS + Tailwind tokens & fonts + ESLint + Prettier + strict folder structure + 17 Drizzle tables & migrations + Seed (4 categories, 8 products, 2 coupons, 1 admin) + Base UI Kit (Button, Input, Select, Badge, Card, Modal, Toast, Skeleton) + Responsive Layout (Sticky Header with Search/Cart/Account, Drawer Nav, Footer, Announcement Bar, Floating WhatsApp) + TRACKER.md + .env.example | **DONE** | `npm run lint` (0 errors) • `npx tsc --noEmit` (0 errors) • `npm run build` (Passed) |
| **Phase 2: Storefront Catalog** | Applied Fixes A-D (env seed with bcrypt, Turso/local DB toggle, migration 0001 with ingredients/absorption/usage guide + reviews table, gitignore data/*.db). Built `/shop`, `/category/[slug]`, `/product/[slug]`, reusable `ProductCard`, money formatting `formatRupees`, SVG placeholder images, JSON-LD Product schema, approved reviews with moderation API, dynamic filters & pagination. | **DONE** | `npm run lint` (0 errors) • `npx tsc --noEmit` (0 errors) • `npm run build` (Passed) • Verified HTTP 200 SSR on all catalog routes |
| **Phase 3: Admin Auth + Catalog Management** | Applied Fixes A-F (production seed env enforcement, no seeded reviews, server-calculated `isVerified` review validation + rate limiting & honeypot, conditional JSON-LD aggregateRating, neutral copy, gitignore verified). Built Auth.js (credentials) with bcrypt (customer/admin roles), proxy + server-side `requireAdmin()` gate on every action/route, admin layout shell, dashboard counts, Category CRUD, Product CRUD with variants (prices in ₹ / stored in paise), storage abstraction image upload (jpg/png/webp <= 2MB), review moderation, toast notifications, and path revalidations. | **DONE** | `npm run lint` (0 errors, 0 warnings) • `npx tsc --noEmit` (0 errors) • `npm run build` (Passed) • Non-admin/logged-out users blocked |
| **Phase 3.1: Responsiveness + Compliance Hotfix** | Fixed horizontal overflow sitewide across viewports (announcement bar, WhatsApp button, w-screen/negative margins removed, min-w-0 flex/grid). Navbar desktop nav at xl (>=1280px), drawer below, icons protected, cart badge inside viewport. Stacked mobile shop toolbar with 2-column filters+sort. ProductCard wrapping and consistent heights. Removed duplicate category pills. Compliance: 0 hardcoded ratings (ProductCard only renders rating when approved reviews exist in DB), neutral copy replacing unsubstantiated claims ("100% GOTS", "100% Rash-Free", "Zero Leaks", "Anion", "Dermatologist Tested"), admin-editable compliance trust badges and announcement text, demo login shown only when `NODE_ENV !== "production"`. | **DONE** | `scrollWidth === innerWidth` verified at 320, 375, 414, 768, 1024, 1280, 1536px across all routes (42/42 PASS) • `npm run lint` (0 errors) • `npx tsc --noEmit` (0 errors) • `npm run build` (Passed) • 0 hardcoded ratings confirmed by grep |
| **Phase 4: Cart, Checkout & Payments** | Applied Fixes A-E (review recompute rating, marketing claim grep/neutralization, dynamic nav/shipping settings, button layer move, env/db untracked). Cart page & drawer with variantId+qty store, server-authoritative pricing in integer paise (`computePricing`), server coupon validation, dynamic shipping fees, checkout with guest/user saved addresses, atomic stock lock with `UPDATE ... WHERE stock >= qty` in 1 DB transaction, idempotency key & rate limiting, PaymentProvider abstraction (Mock dev gateway + Razorpay with HMAC crypto.timingSafeEqual and raw webhook), 30-min lazy cleanup of abandoned online orders, and unguessable publicAccessToken order confirmation. | **DONE** | `npm run lint` (0 errors) • `npx tsc --noEmit` (0 errors) • `npm run build` (Passed) • Automated tests for price tampering, out of stock, concurrent race condition, replay protection, HMAC fixtures |
| **Phase 5: Orders Admin, Customer Account, Emails & Invoicing** | Applied Fixes A-E (`paid_after_cancel` flag, double-cancel idempotency & coupon release, `orders.idempotency_key` UNIQUE constraint, mock provider prod throw/404, isolated `data/test.db` test runner). Built Admin Orders list & detail with state machine enforcement (shipped courier/tracking, delivered COD auto-paid, manual refund notes), admin dashboard metrics (orders today, pending, flagged, net revenue), customer auth (register with bcrypt/rate-limit, forgot/reset password with 1h sha256 single-use token), My Account (profile, addresses CRUD with default, order history & detail with strict data isolation, auto-linking guest orders on registration), Resend email service abstraction (customer confirmation, admin alert, status update, password reset), printable tax invoices (`/order/[token]/invoice` & `/admin/orders/[id]/invoice` with seller settings & optional GST breakup). | **DONE** | `npm run lint` (0 errors, 0 warnings) • `npx tsc --noEmit` (0 errors) • `npm run build` (Passed, 30 routes) • 46 automated tests pass on isolated `data/test.db` |
| **Phase 6: Fixes, Content Pages, Remaining Admin & Verification** | Applied Fixes A-H (Email verification guest-order linking, Customer cancel of paid order -> refund_pending + flagged + stock release once, Forgot-password constant-time response & session revocation via passwordChangedAt + min len 8 + no-referrer, Dynamic Receipt vs Tax Invoice with sequential INV-YYYY-XXXXX, 'returned' status with single restock, revenue calculation exclusions, production RESEND_API_KEY startup alert, test suites for state machine & isolation). Built dynamic home page (banners, categories, featured/bestseller, neutral Why Samaura, zero newsletter, conditional real reviews), offers page, CMS-driven About & FAQ (accordion), Contact page (honeypot, IP rate-limit, emails admin, settings-driven contact info), Blog (/blog & /blog/[slug], JSON-LD Article, draft status, script-stripped Markdown, admin medical disclaimer), Policy pages with legal draft warning. Built remaining Admin modules: Customers (view orders, deactivate), Coupons CRUD, Banners CRUD with active dates, Blog CRUD, Pages CMS editor with live preview, Shipping rules UI, Enquiries inbox, Settings additions (COD, GSTIN, contacts, WhatsApp). | **DONE** | `npm run lint` (0 errors) • `npx tsc --noEmit` (0 errors) • `npm run build` (Passed, 38 routes) • 52 Phase 6 automated tests pass • 0 horizontal overflow at 320–1536px |
| **Phase 7: Hardening, SEO, Deployment Readiness & Handover** | Applied Fixes A-F (behavioural tests for invalidated session after password reset, deactivated user blocked from login/session, expired email token rejected; maintained `sanitize-html` library with complete sanitization; Zod safe URL validation allowing only https:// and relative paths; atomic sequential invoice numbering via `invoice_counters`; unpublish seeded blog & visible draft banners on policy/FAQ/about pages; concurrency test verifying returned/cancelled cannot double restock). Built CSP & security headers, auth hardening with generic errors & persistent DB rate limiter, startup env validation in instrumentation, upload magic-bytes signature verification & Cloudinary storage provider, dynamic sitemap & robots.txt, canonical URLs, Open Graph / Twitter cards, JSON-LD Organization/WebSite, custom not-found/error pages, next/image with sizes, font display swap, cookie consent notice, Turso prod DB scripts (db:migrate, db:seed, db:backup), comprehensive deployment documentation in README.md, and interactive admin handover manual at `/admin/help`. | **DONE** | `npm run lint` (0 errors, 0 warnings) • `npx tsc --noEmit` (0 errors) • `npm run build` (Passed, 41 routes) • 38 Phase 7 tests pass • 52 Phase 6 tests pass • 46 Phase 5 tests pass |
| **Phase 8: Compliance & Security Verification** | Automated PIN code vs State validation, URL protocol sanitization, rel=noopener noreferrer sanitization, analytics consent guard. | **DONE** | `tests/phase8.test.ts` (41 passed, 0 failed) • Claims guard checks |
| **Phase 9: Reviews Lifecycle, Art-Direction & SEO Slugs** | Reviews moderation lifecycle with DB recomputation, image-only hero banner art-direction with `<picture>`, customer status label mapping, shared-circle postal validation, and 301 SEO redirects. | **DONE** | `tests/phase9.test.ts` (87 passed, 0 failed) |
| **Phase 10: Client Content Application (`Data_for_website.docx`)** | Applied exact client text into `pages` and `settings` tables (admin-editable). Added `topic` to contact enquiries, admin email, and admin view. Configured 2 categories only ("Menstrual Cups" & "Gift Collections"), removed sample products from dev DB & seed. Built `/learn`, `/awareness`, `/gifts`. Implemented image-only hero + 3 Initiatives + 3 Explore cards + 3 Gift collections on home page. Hidden empty sections. Verified claims allowlist (`sustainable`, `free from`, `free-from` per client document). | **DONE** | `npm run lint` (0 errors, 0 warnings) • `npx tsc --noEmit` (0 errors) • `npm run build` (Passed, 44 routes) • `check-claims` (Passed) • `check-claims:db` (Passed) • All 6 test suites passed |
| **Phase 11: Home Layout, Testimonials & Clean Gates** | Hero banner (`100vh - header - top notch`), Top Products (featured) & Bestsellers grids (2 cols mobile, 3 sm-md, 4 lg+), Reviews Carousel using standalone `testimonials` table with 44px touch targets & auto-pause (hover/touch/focus/motion), admin Testimonials Manager with claims check, clean single-pass verification gates with re-entry guard. | **DONE** | `npx tsc --noEmit` (0 errors) • `npm run lint` (0 errors) • `npm run check-claims` (0 violations) • `npm run check-claims:db` (0 violations) • `npm run build` (Passed, 45 routes) • All 9 test suites passed (569 assertions) |


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

---

## Detailed Phase 3 Checklist (Definition of Done)

### 1. Mandatory Pre-Fixes A–F
- [x] **Fix A: Production Seed Password Enforcement**:
  - `src/db/seed/index.ts` enforces `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `production`, throwing a critical security error if missing; no default passwords in production.
- [x] **Fix B: Pure Clean Reviews Table**:
  - Deleted any seeded rows in `reviews`; seed file strictly never creates fake reviews. Table starts with 0 reviews.
- [x] **Fix C: Server-Side Review Verification & Protection (`/api/reviews`)**:
  - `isVerified` is strictly computed server-side by checking whether the customer has a `delivered` order containing that product; otherwise false. Never trusts client input.
  - In-memory IP rate limiting added (max 5 submissions per 10 minutes).
  - Honeypot anti-spam field (`hp_website`) added to API and `ProductReviews.tsx`.
  - Input sanitized (HTML stripped, whitespace normalized) and validated with Zod.
- [x] **Fix D: Conditional Product JSON-LD Aggregate Rating**:
  - Product page JSON-LD includes `aggregateRating` schema only when approved reviews exist (> 0).
  - Star rating headline displays "No reviews yet • Be the first to review" instead of dummy ratings.
- [x] **Fix E: Neutralized Unsubstantiated Marketing Claims**:
  - Replaced absolute, unverified claims ("100% Certified Organic") with neutral, verified copy ("Carefully Selected Ingredients & Materials", "Rash-Free Comfort", "Dermatologically Tested", "Skin-Friendly Composition").
- [x] **Fix F: Gitignore Verification**:
  - Confirmed `.env*` is in `.gitignore` (`git check-ignore .env` exits code 0).

### 2. Admin Auth, Gateways & Security
- [x] **Auth.js (Credentials Provider) with Bcrypt**:
  - Secure credential authentication for roles: `customer` and `admin`.
  - In-memory rate limiting for failed login attempts (max 5 attempts per 15 minutes).
  - Clean JWT and session callbacks providing `user.id`, `user.role`, `user.email`.
  - Dedicated login page at `/login` with quick demo sign-in buttons for development.
  - Session helpers: `getCurrentUser()`, `requireAuth()`, `requireAdmin()`.
- [x] **Multi-Layer Admin Protection**:
  - Next.js Proxy (`src/proxy.ts`) protects `/admin/*` and `/account/*`, redirecting unauthenticated users to `/login?callbackUrl=...` and non-admin customers to `/`.
  - Server-side `requireAdmin()` check inside **every single admin server action and route handler** (never relying on middleware alone).
- [x] **Admin Layout Shell (`src/app/admin/layout.tsx` & `src/components/admin/AdminSidebar.tsx`)**:
  - Responsive layout matching brand tokens (`brand #C8202F`, `blush #FFF1F4`, `pink-light #FFD9E2`, `ink #3B1F2B`).
  - Sidebar navigation with active indicator, mobile drawer menu, user status chip, and logout button.

### 3. Catalog & Review Management
- [x] **Admin Dashboard (`/admin`)**:
  - Displays aggregate counts only: Total Products, Active Live Products, Total Categories, Pending Reviews awaiting moderation, Low Stock Variants (<= 10), and Out of Stock Variants.
- [x] **Category CRUD (`/admin/categories`)**:
  - Hierarchical parent/child category management.
  - Automatic slug generation with manual override and uniqueness validation.
  - Active/Draft status toggle and deletion protection (guards against deleting categories with active products or subcategories).
- [x] **Product CRUD (`/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit`)**:
  - Complete form covering name, slug, category, short & long descriptions, badge, and flow type.
  - Dynamic variant array manager (size, pack quantity, unique SKU, stock, default selector).
  - Prices entered in Rupees (₹) in UI, converted and stored strictly as integer paise in the database.
  - Educational specifications: Ingredients & Composition, Absorption Guide, Usage & Disposal Guide.
  - Highlights / feature bullets manager (add/remove).
  - FAQ question & answer builder.
  - Catalog actions: publish/unpublish toggle, soft-delete (deactivate), and hard delete cascade.
- [x] **Image Upload via Storage Abstraction**:
  - Client and server file validation: JPG, PNG, WebP only, maximum 2MB.
  - Unique file renaming (`samaura-<name>-<timestamp>-<rand>.<ext>`) and storage abstraction interface.
  - Gallery manager: drag & drop or file picker, set primary image, reorder, delete image.
- [x] **Review Moderation (`/admin/reviews`)**:
  - Filter tabs: All, Pending, Approved, Rejected.
  - Review details: product card link, star rating, verified buyer badge, reviewer name, date, full text.
  - Server actions: Approve (publishes to storefront), Reject, and Delete.
- [x] **Storefront Integration & Revalidation**:
  - All mutations executed via Server Actions validated with Zod.
  - Interactive toast notifications displayed on all actions.
  - Immediate `revalidatePath` on affected storefront catalog pages (`/shop`, `/category/[slug]`, `/product/[slug]`).

### 4. Verification & Definition of Done
- [x] **ESLint Check**: `npm run lint` -> Passed with 0 errors and 0 warnings.
- [x] **Typecheck**: `npx tsc --noEmit` -> Passed with 0 errors.
- [x] **Production Build**: `npm run build` -> Passed with 0 errors across all routes.
- [x] **Unauthorized Access Block**:
  - Logged-out requests to `/admin` redirect with HTTP 307 to `/login?callbackUrl=...`.
  - Non-admin (customer role) requests to `/admin` redirect with HTTP 302 to `/`.
  - Server actions directly invoke `requireAdmin()` and throw error if called without admin privileges.
- [x] **Admin Authenticated Access**:
  - Admin login with `admin@samaura.com` / `Admin@123456` grants full access (HTTP 200) to `/admin`, `/admin/products`, `/admin/categories`, `/admin/reviews`, `/admin/products/new`, and `/admin/products/[id]/edit`.

---

## Detailed Phase 3.1 Checklist: Responsiveness & Compliance Hotfix

### 1. Responsiveness Fixes
- [x] **Sitewide Horizontal Overflow Fixes**:
  - Root causes identified and resolved without using `overflow-x: hidden` on `body` as a crutch.
  - **Announcement Bar (`AnnouncementBar.tsx`)**: Outer container constrained to `w-full max-w-full overflow-hidden`, inner ticker with `overflow-hidden min-w-0 truncate`.
  - **WhatsApp Floating Button (`WhatsAppButton.tsx`)**: Fixed at `bottom-4 right-4`, container bounded with `max-w-[calc(100vw-2rem)]`, tooltip with `max-w-[calc(100vw-6rem)] truncate`. Never exceeds viewport.
  - **Removed `w-screen` and negative margins**: Replaced viewport width overflows in `ProductFilters.tsx` and `CartDrawer.tsx` (`max-w-[calc(100vw-2rem)]`).
  - **Hero Decorative Blur Orbs (`app/page.tsx`)**: Orbs constrained with `hidden sm:block` and centered on mobile viewports to eliminate horizontal protrusion.
  - **Custom utility overrides in `globals.css`**: Updated `.btn-brand`, `.btn-secondary`, `.btn-blush` with `:not(.hidden)` so that utility classes like `hidden md:inline-flex` take proper precedence without being overridden by button styles.
- [x] **Header & Navigation (`Navbar.tsx`)**:
  - Nowrap links with tighter gaps (`gap-1 xl:gap-1.5 whitespace-nowrap`).
  - Full desktop nav shown **only** at `xl` (>= 1280px); mobile hamburger drawer below 1280px.
  - Desktop "Shop Now" quick button wrapped in `<div className="hidden md:block">` to prevent mobile layout stretch.
  - Brand logo with `shrink min-w-0` and responsive text sizing (`text-sm sm:text-xl md:text-2xl`) allowing clean flex shrinking down to 320px.
  - Logo, search, account, and cart icons always visible without clipping or overlapping.
  - Cart counter badge positioned at `top-0 right-0` securely inside the icon boundary and viewport.
- [x] **Shop & Category Toolbar (`ProductFilters.tsx`)**:
  - Mobile layout stacked: search bar full-width, followed by a 2-column grid containing Filters toggle button and Sort select.
  - Both elements have `w-full min-w-0 truncate`.
  - Sort select never exceeds its container.
  - Category chips strip given `w-full max-w-full min-w-0 overflow-x-auto` to scroll smoothly horizontally without forcing page expansion.
- [x] **ProductCard (`ProductCard.tsx`)**:
  - Flow type badge and rating placed on separate lines on narrow viewports (`flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 min-w-0`).
  - Titles and descriptions wrap cleanly; cards maintain consistent height with flex column layout.
- [x] **Category Page (`category/[slug]/page.tsx`)**:
  - Removed duplicate category pills block; only the primary filter pills inside `ProductFilters` are rendered.

### 2. Compliance Fixes
- [x] **Removed All Hardcoded Ratings & Review Counts**:
  - Product schema default rating updated to 0 in `src/db/schema/index.ts`.
  - Database seed updated to initialize all demo products with `rating: 0` and `reviewCount: 0`.
  - `ProductCard.tsx` displays star rating and count **only when approved reviews exist** (`product.reviewCount && product.reviewCount > 0`).
  - Product detail page shows rating only when `reviewCount > 0 && avgRating`, otherwise displaying "No reviews yet • Be the first to review".
  - Hero social proof badge in `app/page.tsx` replaced with authentic brand promise ("Gentle Cotton Comfort • Breathable and soothing for everyday peace of mind").
  - Verified via global grep: 0 hardcoded ratings (e.g. 4.9, 4.8) remain in source code.
- [x] **Neutralized Marketing Copy Sitewide**:
  - Replaced unsubstantiated absolute claims ("100% GOTS Certified", "100% Certified Organic", "100% Rash-Free", "Zero Leaks", "Anion", "Dermatologist Tested") with neutral, legally compliant language ("Soft organic cotton", "Anti-chafing comfort", "Skin-friendly", "Breathable comfort").
- [x] **Admin-Editable Compliance Trust Badges & Settings**:
  - Created settings management infrastructure in `src/lib/services/settings.ts`, server action `saveSettingsAction` with `requireAdmin()`, and UI in `src/components/admin/SettingsForm.tsx` (`/admin/settings`).
  - Trust badges (*100% GOTS Certified Organic Cotton*, *Dermatologically Tested*, *Zero Leaks Guarantee*) and announcement bar text are stored in the database settings table and disabled by default until verified certificates are on file.
- [x] **Demo Login Guard (`login/page.tsx`)**:
  - Demo login buttons and pre-filled credentials box rendered conditionally **only** when `process.env.NODE_ENV !== "production"`.

### 3. ScrollWidth Verification Results

Automated headless browser check executing `document.documentElement.scrollWidth === window.innerWidth` across all 7 breakpoints and 6 key routes:

| Route | 320px | 375px | 414px | 768px | 1024px | 1280px | 1536px |
|---|---|---|---|---|---|---|---|
| **`/`** (Home) | PASS (320px) | PASS (375px) | PASS (414px) | PASS (768px) | PASS (1024px) | PASS (1280px) | PASS (1536px) |
| **`/shop`** (Shop Catalog) | PASS (320px) | PASS (375px) | PASS (414px) | PASS (768px) | PASS (1024px) | PASS (1280px) | PASS (1536px) |
| **`/category/[slug]`** (Category Listing) | PASS (320px) | PASS (375px) | PASS (414px) | PASS (768px) | PASS (1024px) | PASS (1280px) | PASS (1536px) |
| **`/product/[slug]`** (Product Detail) | PASS (320px) | PASS (375px) | PASS (414px) | PASS (768px) | PASS (1024px) | PASS (1280px) | PASS (1536px) |
| **`/login`** (Authentication) | PASS (320px) | PASS (375px) | PASS (414px) | PASS (768px) | PASS (1024px) | PASS (1280px) | PASS (1536px) |
| **`/admin`** (Admin Dashboard) | PASS (320px) | PASS (375px) | PASS (414px) | PASS (768px) | PASS (1024px) | PASS (1280px) | PASS (1536px) |

**Result**: 42/42 tests PASSED. Zero horizontal overflow across all required viewports.

---

## Detailed Phase 4 Checklist: Cart, Checkout & Payments Engine

### 1. Prerequisite Fixes Applied
- [x] **Fix A: Review Moderation Rating Recomputation**:
  - Implemented `recomputeProductRating(productId)` in `src/lib/services/products.ts`.
  - Calculates average rating and count strictly from approved reviews (`status = 'approved'`). If no approved reviews remain, resets product rating to 0.
  - Hooked into `approveReviewAction`, `rejectReviewAction`, and `deleteReviewAction` in `src/app/admin/actions/reviews.ts`.
  - Verified with automated test script `scripts/test-recompute-reviews.ts`: approval -> 4.5 avg (2 reviews), rejection -> 5.0 avg (1 review), deletion -> 0 rating (0 reviews). All assertions PASSED.
- [x] **Fix B: Neutralized Unsubstantiated Claims**:
  - Scanned and replaced keywords (`anion`, `GOTS`, `certified`, `dermatolog`, `zero leak`, `rash-free`, `"100%"`, `sustainable`, `organic`) across `src/`, seed data, DB rows, metadata, JSON-LD, and footer.
  - Replaced with legally defensible copy ("Gentle on skin", "Breathable comfort", "Dual leak barrier", "Pure cotton softness") or placed behind toggleable admin compliance settings.
- [x] **Fix C: Dynamic Nav Badges and Shipping Settings**:
  - Replaced hardcoded "Save 20%" nav badge with dynamic `nav_offers_badge` setting from DB.
  - Replaced hardcoded free shipping threshold with `shipping_free_threshold_paise` and dynamic rules from `shipping_rules` table.
  - Replaced hardcoded dispatch turnaround copy with dynamic `dispatch_time_text` setting.
- [x] **Fix D: CSS Button Layer Refactoring**:
  - Moved `.btn-brand`, `.btn-secondary`, `.btn-blush`, `.card-soft`, `.badge-*` into `@layer components` in `src/app/globals.css`.
  - Removed `:not(.hidden)` CSS selector hack while preserving Tailwind utility precedence.
- [x] **Fix E: Git Tracking Verification**:
  - Verified via `git ls-files .env* data/` that zero `.env` or `.db` files are tracked in the repository.

### 2. Core Features Built
- [x] **Client Cart Store (`src/lib/cart/store.ts`)**:
  - Stores **only** `variantId` and `quantity` in client localStorage. Never stores client prices or stock numbers.
- [x] **Server-Authoritative Pricing (`src/lib/services/pricing.ts`)**:
  - Single source of truth: `computePricing({ items, couponCode, address, userId })`.
  - Re-reads variant prices and current stock directly from DB.
  - Rejects inactive products/variants, out-of-stock items, and requested qty > stock.
  - Capped coupon discounts, active date check, minOrder requirement, usage limits, and per-user limits.
  - Calculates shipping fees against dynamic thresholds.
  - All financial calculations computed in integer paise.
- [x] **Cart View & Drawer (`/cart` & `CartDrawer.tsx`)**:
  - Quantity stepper, item removal, empty cart state, line item breakdowns, and subtotal.
  - Dynamic price synchronization via server action `computeCartPricingAction`.
- [x] **Checkout Engine (`/checkout` & `src/app/actions/checkout.ts`)**:
  - Guest checkout + logged-in user saved addresses support.
  - Zod validation for customer name, 10-digit Indian phone (`/^[6-9]\d{9}$/`), email, address, city, state, and 6-digit PIN code (`/^\d{6}$/`).
  - Rate-limited per IP (max 10 / 10m) and per phone number (max 5 / 10m).
  - Idempotency key per checkout attempt preventing double-orders on repeated clicks.
  - Cash on Delivery (COD) guarded by admin settings (`cod_enabled` & `cod_max_order_paise`).
  - Online payments hidden when provider is inactive; active when configured.
- [x] **Order Creation in Single DB Transaction (`src/lib/services/orders.ts`)**:
  - Atomic stock decrement with `UPDATE product_variants SET stock = stock - qty WHERE id = ? AND stock >= qty`.
  - Inspects `rowsAffected`: rolls back entire transaction if any variant lacks sufficient stock.
  - Inserts order row, snapshot `order_items`, initial payment row, and records coupon usage in a single transaction.
- [x] **Payment Provider Abstraction (`src/lib/payments/`)**:
  - Provider interface: `createOrder`, `verifyReturn`, `verifyWebhook`.
  - `MockPaymentProvider`: Dev-only sandbox gateway (`/payment/mock`) with Success/Failure simulation executing the exact server confirmation path. Throws fatal error in production environment.
  - `RazorpayPaymentProvider`: Server-side order creation in paise, HMAC-SHA256 verification using `crypto.timingSafeEqual`, raw-body webhook handler (`/api/razorpay/webhook`), idempotent payment confirmation, and currency/amount matching.
  - Dormant online payments when unconfigured; COD functional at launch.
  - 30-minute lazy cleanup releasing reserved stock from abandoned online payments.
- [x] **Order Confirmation (`/order/[token]`)**:
  - Access controlled via unguessable 48-character `publicAccessToken`.
  - Displays ordered items, delivery address, payment status, and order totals without exposing sequential IDs or customer data.

### 3. Order Status State Machine & Allowed Transitions

```
[ pending_payment ] (Initial for online payment)
       │
       ├─────────────────────────────────┐
       ▼ (payment captured / webhook)    ▼ (payment failed / 30m timeout)
   [ placed ]                        [ cancelled ] ──> (Stock released to inventory)
       │
       ▼ (verified for fulfillment)
  [ confirmed ]
       │
       ▼ (dispatched with tracking)
   [ shipped ]
       │
       ▼ (handed over to customer)
  [ delivered ]
       │
       ▼ (return / quality claim approved)
   [ refunded ]
```

#### Allowed State Transitions:
1. **`pending_payment`**:
   - `-> placed`: Online payment verified via webhook (`payment.captured` / `order.paid`) or return callback.
   - `-> cancelled`: Payment failed or timed out after 30 minutes; reserved stock is atomically restored.
2. **`placed`**:
   - Initial state for Cash on Delivery (COD) orders, or post-payment online orders.
   - `-> confirmed`: Verified by store admin for warehouse packaging.
   - `-> cancelled`: Customer or admin cancels before packing; stock restored.
3. **`confirmed`**:
   - `-> shipped`: Handed over to logistics carrier with tracking number.
   - `-> cancelled`: Cancelled prior to courier dispatch; stock restored.
4. **`shipped`**:
   - `-> delivered`: Successfully delivered to recipient address.
   - `-> cancelled`: Undeliverable / Return to Origin (RTO).
5. **`delivered`**:
   - `-> refunded`: Customer return approved or dispute resolved; funds refunded.
6. **`cancelled`**:
   - Terminal state. Stock has been restored. No further transitions allowed.
7. **`refunded`**:
   - Terminal state. Refund recorded. No further transitions allowed.

#### Payment Statuses:
- **`pending`**: Awaiting gateway confirmation (online orders).
- **`pending_cod`**: Payment to be collected upon physical delivery (Cash on Delivery).
- **`paid`**: Payment successfully captured and verified.
- **`paid_after_cancel`**: Late payment arrived after order was cancelled/expired; flagged for manual review & refund; stock kept untouched.
- **`failed`**: Payment failed, cancelled, or rejected by bank.
- **`refunded`**: Payment reversed to customer account.

---

## Detailed Phase 5 Checklist (Definition of Done)

### 1. Mandatory Pre-Fixes A–E
- [x] **Fix A: Late Payment Webhook/Confirmation Handling**:
  - In `confirmOrderPayment`, if a successful payment confirmation or webhook arrives for an order that is already in `cancelled` status, the order is **NOT** re-confirmed or reactivated.
  - Payment status is set to `paid_after_cancel`.
  - Admin review flag `isFlaggedForReview` is set to `true` with `flagReason` indicating late arrival.
  - Inventory stock is left untouched (never decremented again).
  - Automated test verified in `tests/phase5.test.ts`.
- [x] **Fix B: Double-Cancel Idempotency & Coupon times_used Decrement**:
  - Cancel, fail, and timeout paths decrement `coupons.times_used = MAX(0, times_used - 1)` and restock inventory exactly once.
  - Calling cancel multiple times (double-cancel) is strictly idempotent: early exit returns `{ ok: true, alreadyCancelled: true }` without double-restocking or double-decrementing coupon usage.
  - Automated tests verified in `tests/phase5.test.ts`.
- [x] **Fix C: Unique Constraint on `orders.idempotency_key`**:
  - Drizzle schema updated with `.unique()` on `orders.idempotencyKey`.
  - Migration `0002_chemical_prism.sql` applied with `CREATE UNIQUE INDEX orders_idempotency_key_unique ON orders (idempotency_key)`.
  - Automated test verified in `tests/phase5.test.ts` (violating duplicate key rejected by SQLite constraint).
- [x] **Fix D: Mock Provider Production Safeguards**:
  - `MockPaymentProvider` constructor unconditionally throws an error in `production` environment.
  - Dedicated route `/payment/mock` immediately calls `notFound()` when `process.env.NODE_ENV === "production"`.
- [x] **Fix E: Isolated Test Database & Dev DB Purity**:
  - Test suites (`tests/phase5.test.ts`) run against isolated `data/test.db` and delete `data/test.db` after execution.
  - Verified `data/samaura.db` contains 0 test rows (0 orders, 0 reset tokens, 0 extraneous addresses).

### 2. Admin Orders Management & Dashboard Additions
- [x] **Admin Orders List (`/admin/orders`)**:
  - Search by Order Number, Customer Phone, Customer Email, Customer Name.
  - Filter by Order Status (`all`, `placed`, `confirmed`, `shipped`, `delivered`, `cancelled`, `refunded`).
  - Filter by Payment Method (`all`, `razorpay`, `cod`, `mock`).
  - Filter by Payment Status (`all`, `pending`, `pending_cod`, `paid`, `paid_after_cancel`, `failed`, `refunded`).
  - Pagination with configurable limit, previous/next controls, and page summary.
  - Direct links to order details and printable tax invoice.
  - Protected with `requireAdmin()` in page and server actions.
- [x] **Admin Order Detail (`/admin/orders/[id]`)**:
  - Items snapshot (product image, title, variant, SKU, unit rate, quantity, line total).
  - Financial breakdown (subtotal, coupon discount, shipping fee, grand total).
  - Shipping address card and customer phone/email.
  - Payment gateway logs & transaction references.
  - Review flag badge for `paid_after_cancel` orders with one-click review flag resolution.
  - Fulfillment actions enforcing allowed state machine transitions:
    - Dispatch with Courier Name & Tracking Number modal.
    - Delivery confirmation (auto-marks COD payments as `paid` and stamps `deliveredAt`).
    - Cancellation with stock restock and coupon usage restoration.
    - Manual refund recording with mandatory notes (no gateway call yet).
- [x] **Admin Dashboard Additions (`/admin`)**:
  - Orders Today metric card.
  - Pending Fulfillment Orders counter.
  - Flagged "Paid After Cancel" review alert card with direct filter link.
  - Net Revenue card (paid or delivered orders only).

### 3. Customer Authentication & Account Management
- [x] **Customer Authentication (`/register`, `/login`, `/forgot-password`, `/reset-password`)**:
  - Customer registration with Zod validation (name, email, password >= 6 chars, Indian 10-digit phone), bcrypt (12 salt rounds), in-memory IP rate limiting, and automatic login on register.
  - Auto-links previous guest orders matching verified customer email on registration.
  - Password reset request generating single-use cryptographically secure random token (SHA-256 hashed in DB), 1-hour expiry, with rate-limiting.
  - Password reset completion enforcing single-use (rejects reuse) and expiration validation.
- [x] **My Account Dashboard (`/account`)**:
  - Tabbed interface: Orders History, Saved Addresses, Profile & Security.
  - Saved delivery addresses CRUD:
    - List addresses with default shipping indicator.
    - Add new address modal with Indian PIN code validation.
    - Edit existing address modal.
    - Delete address with confirmation.
    - Set primary default address.
  - Profile manager: edit customer name and phone.
  - Security card: request password reset link dispatch.
- [x] **Customer Order Detail (`/account/orders/[id]`)**:
  - Strict data isolation: authenticated customer can only view orders where `userId === session.user.id` or `customerEmail === session.user.email`. Unauthorized or cross-customer access returns 404.
  - Visual status progress stepper (Order Placed -> Confirmed -> Shipped -> Delivered).
  - Courier tracking information badge when dispatched.
  - Order items snapshot and totals breakdown.
  - Direct link to print tax invoice.
  - Online cancellation action for placed/pending orders.

### 4. Email Service Abstraction & Notifications
- [x] **Resend Email Service (`src/lib/email/index.ts`)**:
  - Service abstraction over Resend SDK.
  - Fallback in local development: logs clean formatted email summaries to the console when `RESEND_API_KEY` is missing.
  - All customer inputs sanitized with `escapeHtml()` to eliminate HTML/script injection risks.
  - Emails dispatched non-blockingly after DB transaction commits (`.catch()` handler prevents blocking checkout flow).
  - Templates:
    - Customer Order Confirmation (`sendOrderConfirmationEmail`).
    - Admin New Order Notification Alert (`sendNewOrderAdminAlertEmail`).
    - Order Status Updates: Shipped with courier/tracking, Delivered, Cancelled (`sendOrderStatusUpdateEmail`).
    - Password Reset Link (`sendPasswordResetEmail`).

### 5. Printable Invoices
- [x] **Tax Invoice Component & Endpoints**:
  - Reusable printable component: `src/components/orders/InvoiceView.tsx`.
  - Customer route: `/order/[token]/invoice` (accessible via unguessable token).
  - Admin route: `/admin/orders/[id]/invoice` (protected with `requireAdmin()`).
  - Seller details and registered address from dynamic settings (`seller_name`, `seller_address`, `seller_email`, `seller_phone`).
  - Explicit "Inclusive of all applicable taxes" notice.
  - GST breakup hidden behind `show_gst_breakup` setting until client confirms GST registration (no invented tax numbers).
  - Dedicated print styling: `@media print` layout, page margin rules, hidden navigation bars, and print/save-as-PDF trigger.

### 6. Verification & Test Results
- [x] **Linter**: `npm run lint` -> Passed with 0 errors and 0 warnings.
- [x] **Typecheck**: `npx tsc --noEmit` -> Passed with 0 errors.
- [x] **Production Build**: `npm run build` -> Passed, all 30 routes generated.
- [x] **Automated Test Suite (`tests/phase5.test.ts`)**:
  - **46 passed, 0 failed** against isolated `data/test.db`.
  - Late payment flag (`paid_after_cancel`, stock untouched): PASS.
  - Double-cancel idempotency (`coupons.times_used` decremented once, stock restocked once): PASS.
  - `orders.idempotency_key` unique constraint: PASS.
  - Status state machine transitions & tracking requirements: PASS.
  - Customer data isolation & unauthorized order blocking: PASS.
  - Reset token reuse & expiry rejection: PASS.
  - Dev database purity verification (`data/samaura.db` untouched): PASS.

---

## Detailed Phase 6 Checklist (Definition of Done)

### 1. Fixes A through H
- [x] **Fix A: Guest-Order Linking with Verification**:
  - Registration alone no longer auto-links guest orders.
  - Generates a single-use SHA-256 hashed verification token with 24h expiration in `email_verification_tokens`.
  - Rate-limited verification email resend (`checkRateLimit("resend_verify:...")`).
  - Guest orders linked to `userId` only after email verification is completed via `/verify-email?token=...`.
  - Automated tests confirm unverified user cannot view guest orders, while verification safely links them.
- [x] **Fix B: Customer Cancel of Paid Order**:
  - Customer cancellation of a paid online order updates `paymentStatus` to `refund_pending`, flags the order in admin (`isFlaggedForReview = 1`, `flagReason = "Customer cancelled paid order - refund pending"`), and releases reserved stock exactly once.
  - Admin fulfillment flow permits transitioning from `cancelled` + `paid` (or `refund_pending`) to `refunded` with mandatory audit notes.
  - Stock is not double-restocked during refund.
- [x] **Fix C: Forgot-Password Hardening & Session Revocation**:
  - `/forgot-password` returns identical success response regardless of whether the email exists in DB.
  - Rate-limited per IP and per email.
  - Password reset updates `passwordChangedAt` timestamp on `users` table.
  - Auth.js JWT callback invalidates active session tokens issued before `passwordChangedAt`.
  - Minimum password length of 8 characters enforced in Zod validation on both registration and reset.
  - Added `Referrer-Policy: no-referrer` meta tag and HTTP response headers on password reset pages.
- [x] **Fix D: Sequential Invoices & Dynamic Tax vs Receipt Title**:
  - Invoices display title `"Order Receipt"` by default.
  - Automatically switches title to `"Tax Invoice"` only when `seller_gstin` setting is populated and `show_gst_breakup` setting is `"true"`.
  - Sequential, unique invoice numbers generated in format `INV-YYYY-XXXXX`.
- [x] **Fix E: "Returned" Status & Single Restock**:
  - Added `returned` status to `order_status` schema enum for COD refusals and Return-To-Origin (RTO).
  - Allowed transition: `shipped -> returned`.
  - Restocks inventory exactly once upon transitioning to `returned` (idempotent; restock flag stored in `stock_restocked`).
- [x] **Fix F: Revenue Card Exclusions**:
  - Dashboard Net Revenue calculation in `orders.ts` strictly excludes `refunded`, `returned`, and `cancelled` orders (even if previously paid).
- [x] **Fix G: Production RESEND_API_KEY Startup Log**:
  - When `NODE_ENV === "production"` and `RESEND_API_KEY` is missing or placeholder, startup instrumentation (`src/instrumentation.ts`) and email service log a prominent startup error alert.
- [x] **Fix H: Automated Test Suite Output Verification**:
  - Suite `tests/phase6.test.ts` exercises all negative/positive flows against an isolated SQLite test database.

### 2. Storefront Content Pages
- [x] **Home Page (`/`)**:
  - Hero and promo banners queried dynamically from `banners` table matching active window dates.
  - Category tiles rendered from `categories` table.
  - Featured and Bestseller product carousels/grids queried directly from DB.
  - "Why Samaura" section loaded from CMS `pages` (`slug = 'why-samaura'`) with neutral, admin-editable copy.
  - 100% newsletter-free.
  - Zero hardcoded testimonials or star ratings; customer reviews displayed only when approved reviews exist in DB.
- [x] **Offers Page (`/offers`)**:
  - Displays all products currently having a `salePricePaise` set.
  - Shows active public coupons with code, discount percentage or amount, minimum order value, and copy-to-clipboard button.
- [x] **About & FAQ Pages (`/about`, `/faq`)**:
  - Content dynamically served from `pages` table (`slug = 'about'` and `slug = 'faq'`).
  - FAQ rendered as an accessible, interactive accordion (`FaqAccordion.tsx`).
  - Seeded with neutral placeholder copy marked `"Replace with client content"`.
- [x] **Contact Page (`/contact`)**:
  - Interactive enquiry form (`ContactForm.tsx`) with Zod validation, honeypot field (`hp_website`), and per-IP rate limiting.
  - Stores submissions to `enquiries` table and sends email notification to admin.
  - Contact details (email, helpline phone, WhatsApp number, business hours) rendered dynamically from `settings` table without hardcoded phone numbers.
- [x] **Blog System (`/blog` & `/blog/[slug]`)**:
  - Paginated blog listing with cover images, reading time, published dates, and excerpt cards.
  - Article reader with dynamic SEO metadata, JSON-LD `Article` schema, and published/draft access control.
  - Markdown rendered with sanitization (`renderMarkdownToHtml` strips raw `<script>` tags, inline event handlers, and javascript: links).
  - Admin-editable health & wellness disclaimer banner rendered at the top of each article.
- [x] **Policy Pages (`/privacy`, `/terms`, `/shipping-returns`)**:
  - Served dynamically from `pages` table.
  - Rendered with prominent disclaimer banner: *"Draft, review with a legal professional before launch"*.

### 3. Admin Additions
- [x] **Customers (`/admin/customers`)**:
  - Customer directory with search, order history count, and lifetime spend.
  - Customer order list view and one-click account deactivation/activation toggle.
- [x] **Coupons CRUD (`/admin/coupons`)**:
  - Manage percentage/fixed discount coupons, minimum order value, usage limits, and active date ranges.
- [x] **Banners CRUD (`/admin/banners`)**:
  - Manage homepage hero and promo banners with image URL upload, display ordering, title/subtitle, link URL, and active date window.
- [x] **Blog CRUD (`/admin/blog`)**:
  - Create and edit articles with Markdown body, cover image, slug, excerpt, and published/draft toggle.
- [x] **Pages CMS (`/admin/pages`)**:
  - Static pages editor for `about`, `faq`, `why-samaura`, `privacy`, `terms`, `shipping-returns` with live split-screen preview.
- [x] **Shipping Rules UI (`/admin/shipping`)**:
  - Configure tiered shipping rules (minimum order thresholds and base shipping fees).
- [x] **Enquiries Inbox (`/admin/enquiries`)**:
  - Customer support inbox to view enquiries, mark as read/resolved, or delete.
- [x] **Settings (`/admin/settings`)**:
  - Dynamic store settings for COD enabled/max order value, store contact phone/email, seller GSTIN, show GST breakup toggle, announcement text, WhatsApp helpline, and medical disclaimer copy.

### 4. Responsiveness & Quality Gates
- [x] **Zero Horizontal Overflow**:
  - Verified across 320px, 375px, 414px, 640px, 768px, 1024px, 1280px, and 1536px viewports via automated Playwright headless browser script.
  - All interactive icons, cart drawer badges, and navigation headers remain unclipped.
- [x] **Verification & Test Results**:
  - `npm run lint` -> Passed (0 errors, 0 warnings).
  - `npx tsc --noEmit` -> Passed (0 errors).
  - `npm run build` -> Passed (38/38 routes generated in Turbopack).
  - `tests/phase6.test.ts` -> **52 passed, 0 failed**.
  - `tests/phase5.test.ts` -> **46 passed, 0 failed**.

---

## Detailed Phase 7 Checklist (Hardening, SEO, Deployment Readiness & Handover)

### 1. Mandatory Fixes A–F
- [x] **Fix A: Behavioural Security Tests**:
  - (1) JWT sessions issued before a password reset are rejected afterwards (`token.authTime < user.passwordChangedAt`).
  - (2) Deactivated user (`isActive: false`) cannot log in via credentials and existing active session is rejected.
  - (3) Expired (>24h) email verification token is rejected with explicit expiration error message.
- [x] **Fix B: Maintained Markdown Sanitizer**:
  - Replaced hand-rolled regex sanitizer with industry-standard `sanitize-html`.
  - Comprehensive protection tested against: `data:` URIs in links/images, `<img onerror>`, `<svg onload>`, mixed-case `JaVaScRiPt:`, HTML-entity encoded payloads, `<iframe>`, and `<style>`/`<link>` tags.
- [x] **Fix C: Safe Banner and CMS URLs with Zod**:
  - `safeUrlOrRelative` and `safeRequiredUrlOrRelative` schemas strictly enforce `https://` or relative `/...` paths.
  - Explicitly rejects `javascript:`, `data:`, and insecure `http://` schemes.
- [x] **Fix D: Concurrency-Safe Sequential Invoice Numbers**:
  - Atomic sequence generation inside order transaction using `invoice_counters` table and LibSQL `RETURNING last_sequence`.
  - Concurrency test with `Promise.all` confirms strictly unique, sequential `INV-YYYY-XXXXX` generation across 5 simultaneous orders.
- [x] **Fix E: Content Pages Draft Warning & Seed Sanitization**:
  - Seeded blog articles marked draft (`isPublished: false`).
  - Prominent draft warning banner rendered on `/about`, `/faq`, `/privacy`, `/terms`, `/shipping-returns` (*"Replace with client content before production launch"*).
- [x] **Fix F: Concurrency Restocking Guards**:
  - Verified with `Promise.all` that 5 concurrent cancellation calls restock inventory exactly once.
  - Verified with `Promise.all` that 5 concurrent 'returned' status updates restock inventory exactly once and transition exactly once.

### 2. Security Hardening
- [x] **Security Headers (`next.config.ts`)**:
  - Strict Content-Security-Policy (CSP) allowing self, Razorpay checkout, Google Analytics (only if configured), and image sources.
  - `X-Frame-Options: DENY` (and frame-ancestors 'none').
  - `X-Content-Type-Options: nosniff`.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
  - HSTS enabled in production (`max-age=63072000; includeSubDomains; preload`).
- [x] **Auth Hardening (`src/lib/auth/index.ts`)**:
  - `AUTH_SECRET` required in production (throws on startup if missing).
  - Secure, httpOnly, sameSite cookies enforced in production.
  - Generic login error messages prevent username enumeration.
  - Persistent rate limiting on admin and customer login endpoints.
- [x] **Startup Env Validation (`src/lib/env.ts` & `src/instrumentation.ts`)**:
  - Zod validation runs on server startup via Next.js instrumentation hook.
  - Fails fast in production if required variables (`DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`) are missing.
  - Secrets are never logged to console or stdout.
- [x] **Persistent Database-Backed Rate Limiting (`src/lib/rateLimit.ts`)**:
  - Replaced in-memory limiter with `rate_limits` table in database.
  - Limits survive process restarts and horizontally scaled multi-instance deployments.
- [x] **Upload Safety & Storage Abstraction (`src/lib/storage/index.ts`)**:
  - File magic bytes verification (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF...WEBP`).
  - `Content-Disposition: inline` and `X-Content-Type-Options: nosniff`.
  - Storage abstraction supports `LocalStorageProvider` and `CloudinaryStorageProvider` selected via `STORAGE_PROVIDER=cloudinary`.

### 3. SEO & Storefront Performance
- [x] **Dynamic Sitemap & Robots (`app/sitemap.ts`, `app/robots.ts`)**:
  - `app/sitemap.ts` dynamically indexes products, active categories, published blog posts, and core content pages.
  - `app/robots.ts` allows public storefront pages while disallowing `/admin`, `/account`, `/cart`, `/checkout`, `/order`, `/api`.
  - Robots `noindex, nofollow` metadata set on private and checkout pages.
- [x] **Metadata & Structured Data (`src/app/layout.tsx`)**:
  - Canonical URLs, Open Graph, and Twitter metadata cards configured.
  - JSON-LD schemas for `Organization` and `WebSite` with SearchAction.
- [x] **Custom Error Pages**:
  - Dedicated custom `src/app/not-found.tsx` (404), `src/app/error.tsx` (500), and `src/app/global-error.tsx`.
- [x] **Performance & Accessibility**:
  - Optimized `next/image` with responsive `sizes` attribute across storefront.
  - Font display `swap` for Poppins and Inter Google fonts.
  - Route caching and revalidation configured (`revalidate = 60`).
  - Accessible focus states, aria labels, role regions, and keyboard escape handling.

### 4. Legal & Operational Handover
- [x] **Cookie Consent Banner (`src/components/common/CookieNotice.tsx`)**:
  - Rendered only when `NEXT_PUBLIC_GA_ID` is defined.
  - Built with `useSyncExternalStore` for React 19 compliance without hydration waterfalls.
- [x] **Production Database Scripts (`package.json`)**:
  - `npm run db:migrate` -> Applies migrations to production Turso database.
  - `npm run db:seed` -> Production-safe seed creating admin only from env variables.
  - `npm run db:backup` -> SQLite database snapshot and backup utility.
- [x] **Deployment Documentation (`README.md`)**:
  - Step-by-step guides for Vercel + Turso and VPS Docker + Caddy deployments.
  - Complete environment variable dictionary with secret handling instructions.
  - DNS, Resend SPF/DKIM verification, Razorpay go-live checklist, post-deploy smoke tests, and rollback procedures.
- [x] **Admin Handover Knowledge Base (`src/app/admin/help/page.tsx`)**:
  - Built interactive `/admin/help` page with 6 comprehensive operating procedures:
    1. Adding & Managing Products
    2. Processing & Fulfilling Orders
    3. Moderating Customer Reviews
    4. Editing Content Pages & Banners
    5. Managing Cash on Delivery & Limits
    6. Customer Accounts & Security

### 5. Final Quality Gates
- `npm run lint` -> **PASSED (0 errors, 0 warnings)**
- `npx tsc --noEmit` -> **PASSED (0 errors)**
- `npm run build` -> **PASSED (41/41 routes optimized and generated)**
- `tests/phase7.test.ts` -> **38 passed, 0 failed**
- `tests/phase6.test.ts` -> **52 passed, 0 failed**
- `tests/phase5.test.ts` -> **46 passed, 0 failed**

---

## Detailed Phase 10 Checklist (Definition of Done)

### 1. Settings & Brand Identity
- [x] Phone updated to `+91 6282132510`, support email to `samaurahealthcare@gmail.com`.
- [x] Base site URL set to `https://www.samaurahealthcare.com` (`.env.example` placeholder updated).
- [x] Social links (Instagram, Facebook, LinkedIn) left empty; footer hides empty icon links cleanly.
- [x] WhatsApp number left empty until confirmed; floating WhatsApp button hidden when empty.
- [x] JSON-LD `Organization` schema description and storefront metadata updated to match education, awareness, menstrual cups, and gifting.

### 2. About Page (`pages` table, slug: `about`)
- [x] Exact client copy applied from `Data_for_website.docx`:
  - Heading "About Us".
  - Overview paragraphs on purpose-driven startup, young people education, stigma-breaking, menstrual cups as reusable alternative, and combining awareness with hygiene solutions.
  - Mission: "To empower women, girls, and young people through accessible menstrual health education, community awareness, and practical menstrual hygiene solutions, ensuring that no one is left uninformed or unsupported during menstruation."
  - Vision: "A society where menstruation is free from stigma, every young person has access to age-appropriate menstrual education, and every individual can make informed choices about menstrual hygiene with confidence, dignity, and access to appropriate products."
- [x] Removed "Replace with client content" banner from About page.

### 3. Home Page Content Order & Legacy Copy Purge
- [x] Kept image-only hero banner with `<picture>` art-direction.
- [x] Added in exact specified order with neutral card styling:
  1. **Our Key Initiatives** (3 cards):
     - Menstrual Health Education & Publications
     - Menstrual Awareness & Community Empowerment
     - Sustainable Menstrual Hygiene, Thoughtful Gifting & Partnerships
  2. **Explore Samaura** (3 cards):
     - Samaura Menstrual Cup (links to `/category/menstrual-cups`)
     - Learn Before You Transition (links to `/learn`)
     - Awareness & Support (links to `/awareness`)
  3. **Gift Collections** (3 cards, link to `/gifts`):
     - My First Period Gift Box
     - Self-Care & Celebration Hampers
     - Custom & Institutional Gift Packs
- [x] Removed all old pads/cotton copy, discreet-delivery bands, and legacy sections describing pads, liners, wash, or roll-ons.
- [x] Conditional rendering: customer reviews and articles render only when published items exist in the database.

### 4. New Admin-Editable CMS Routes
- [x] `/learn` ("Learn Before You Transition"): Rendered with client text, sitemap entry, and fallback "Resources coming soon" block until client adds content.
- [x] `/awareness` ("Awareness & Support"): Rendered with client text, sitemap entry, and "Request a session" CTA linking to `/contact?topic=awareness`. Zero invented dates.
- [x] `/gifts` ("Gift Collections"): Rendered with 3 collections, sitemap entry, and "Enquire" buttons to `/contact?topic=gift` (first two) and `/contact?topic=institutional` (third). Explicitly enquiry-only.
- [x] Registered `/learn`, `/awareness`, `/gifts` in `src/app/sitemap.ts`.

### 5. Contact Enquiries Topic Management
- [x] Added `topic` column to `enquiries` table (default: `General`).
- [x] Migrated remote Turso DEV database and local SQLite database (`ALTER TABLE enquiries ADD COLUMN topic text DEFAULT 'General'`).
- [x] Added topic selector with 5 options:
  - `General`
  - `Menstrual cup`
  - `Awareness session`
  - `Gift pack`
  - `Institutional/CSR`
- [x] Auto-prefilled from query parameter `?topic=` (mapping `awareness` -> `Awareness session`, `gift` -> `Gift pack`, `institutional` -> `Institutional/CSR`, `cup` -> `Menstrual cup`).
- [x] Topic stored in `enquiries` table, passed in admin alert email, and displayed in admin enquiries inbox and modal.

### 6. Catalogue & Sample Product Removal
- [x] Categories set strictly to 2: "Menstrual Cups" (`menstrual-cups`) and "Gift Collections" (`gift-collections`).
- [x] Removed all sample products (pads, liners, wash, roll-on, sterilizer) from DEV DB and dev seed.
- [x] Zero demo products in production. Client will add real cup product(s) via admin panel.
- [x] Updated shop page copy, category descriptions, and product SEO defaults to match the new business model.
- [x] Existing redirects in `next.config.ts` preserved safely.

### 7. Layout, Navigation & Footer
- [x] Navbar: Shop, Explore (Learn, Awareness), Gifts, About, Contact.
- [x] Footer description dynamically pulled from About overview first sentence.
- [x] Footer contact block rendered from store settings.
- [x] Social links and WhatsApp buttons hidden when settings values are empty.

### 8. Compliance & Test Verifications
- [x] `config/claims-allowlist.json` updated ONLY with client-supplied phrases triggering guard (`sustainable`, `free from`, `free-from` per client document reference).
- [x] `npm run check-claims` -> **PASSED (0 violations)**
- [x] `npm run check-claims:db` -> **PASSED (0 violations on Turso DEV DB & local DB)**
- [x] `npm run lint` -> **PASSED (0 errors, 0 warnings)**
- [x] `npx tsc --noEmit` -> **PASSED (0 errors)**
- [x] `npm run build` -> **PASSED (44 routes compiled)**
- [x] `tests/phase4-checkout.test.ts` -> **26 passed, 0 failed**
- [x] `tests/phase5.test.ts` -> **46 passed, 0 failed**
- [x] `tests/phase6.test.ts` -> **52 passed, 0 failed**
- [x] `tests/phase7.test.ts` -> **40 passed, 0 failed**
- [x] `tests/phase8.test.ts` -> **41 passed, 0 failed**
- [x] `tests/phase9.test.ts` -> **91 passed, 0 failed**
- [x] Updated `README.md` note stating client must supply real photos before launch.

### 9. Viewports for Manual Verification
- **Mobile Extra-Small**: 320px
- **Mobile Standard**: 375px
- **Tablet / Phablet**: 768px
- **Desktop Standard**: 1024px
- **Desktop Large**: 1440px

### 10. Core URLs for Manual Verification
- Home: `/`
- About Us: `/about`
- Learn Guide: `/learn`
- Awareness & Workshops: `/awareness`
- Gift Collections: `/gifts`
- Shop: `/shop`
- Category - Menstrual Cups: `/category/menstrual-cups`
- Category - Gift Collections: `/category/gift-collections`
- Contact & Topic Enquiry: `/contact`
  - `/contact?topic=awareness`
  - `/contact?topic=gift`
  - `/contact?topic=institutional`
  - `/contact?topic=cup`
- FAQ: `/faq`
- Privacy Policy: `/privacy`
- Shipping & Returns: `/shipping-returns`
- Terms & Conditions: `/terms`
- Admin Enquiries Inbox: `/admin/enquiries`

---

## Detailed Phase 10.1 Checklist: Sample Products for Testing

### 1. Categories & Sample Products Overview
- [x] **Categories**:
  - `Menstrual Cups` (`cat_menstrual_cups`, slug: `menstrual-cups`)
  - `Gift Collections` (`cat_gift_collections`, slug: `gift-collections`)
  - `Books & Learning` (`cat_books_learning`, slug: `books-learning`) - Added for the publications initiative.
- [x] **8 Sample Products** (seeded strictly in non-production environments with `isSample = true` and `SMP-` SKUs):
  1. `Samaura Menstrual Cup` (Menstrual Cups): Variants Small, Medium, Large. Price ₹499 (49900 paise), sale ₹399 (39900 paise). Stock 40 each. Featured & Bestseller.
  2. `Samaura Menstrual Cup, Pack of 2` (Menstrual Cups): Variants Small + Small (stock 25), Medium + Medium (stock 3 to test low-stock state). Price ₹899 (89900 paise), sale ₹749 (74900 paise).
  3. `Cup Storage Pouch` (Menstrual Cups): Variant Standard. Price ₹149 (14900 paise). Stock 60.
  4. `Menstrual Health Guide` (Books & Learning): Variant Paperback. Price ₹199 (19900 paise). Stock 30.
  5. `Activity Book for Young Readers` (Books & Learning): Variant Paperback. Price ₹249 (24900 paise), no sale. Stock 0 to test out-of-stock state.
  6. `My First Period Gift Box` (Gift Collections): Variants Standard (stock 15, ₹999 base, ₹899 sale), Deluxe (stock 15, ₹1499 base). Featured & Bestseller.
  7. `Self-Care Celebration Hamper` (Gift Collections): Variants Small (stock 10, ₹1299 base), Large (stock 10, ₹1999 base).
  8. `Mini Gift Pack` (Gift Collections): Variant Standard (stock 20, ₹499 base).

### 2. Packaging Vector Assets (`/public/products`)
- [x] Reused `menstrual-cup.svg` for primary cup.
- [x] Created `menstrual-cup-duo.svg`, `storage-pouch.svg`, `health-guide-book.svg`, `activity-book.svg`, `first-period-gift.svg`, `celebration-hamper.svg`, `mini-gift-pack.svg`.
- [x] Neutral, brand-harmonious blush/pink SVG art with product name/wordmark only, zero unverified claim text.
- [x] All SVGs pass `check-claims` with 0 matches.

### 3. Cleanup Utility & Safety Guardrails
- [x] Script `npm run db:remove-samples`:
  - Dry-run by default (lists all 8 sample products, deletes nothing).
  - Requires `--confirm` to delete `isSample = true` rows, associated variants, images, and empty sample-only categories (`books-learning`).
  - Prints sanitized DB host only (never secrets or auth tokens).
- [x] Production seed guard (`process.env.NODE_ENV === "production"`) creates 0 sample products.
- [x] Documentation added in `README.md` and `/admin/help` detailing how to remove sample data before client launch.

### 4. Verification Gates & Test Results
- [x] `npm run check-claims` -> **PASSED (0 violations)**
- [x] `npm run check-claims:db` -> **PASSED (0 violations on Turso DEV DB)**
- [x] `npm run lint` -> **PASSED (0 errors, 0 warnings)**
- [x] `npx tsc --noEmit` -> **PASSED (0 errors)**
- [x] `npm run build` -> **PASSED (44 routes compiled/prerendered)**
- [x] `tests/phase10-1.test.ts` -> **121 passed, 0 failed**
- [x] `tests/phase4-checkout.test.ts` -> **26 passed, 0 failed**
- [x] `tests/phase5.test.ts` -> **46 passed, 0 failed**
- [x] `tests/phase6.test.ts` -> **52 passed, 0 failed**
- [x] `tests/phase7.test.ts` -> **40 passed, 0 failed**
- [x] `tests/phase8.test.ts` -> **41 passed, 0 failed**
- [x] `tests/phase9.test.ts` -> **91 passed, 0 failed**

### 5. URLs for Verification
- Shop Catalog: `http://localhost:3000/shop`
- Category - Menstrual Cups: `http://localhost:3000/category/menstrual-cups`
- Category - Gift Collections: `http://localhost:3000/category/gift-collections`
- Category - Books & Learning: `http://localhost:3000/category/books-learning`
- Product with 3 variants: `http://localhost:3000/product/samaura-menstrual-cup`
- Out-of-Stock product: `http://localhost:3000/product/activity-book-young-readers`
- Home page featured section: `http://localhost:3000/`

---

## Detailed Phase 11 Checklist: Home Layout, Testimonials & Clean Gates

### 1. Home Page Structure & Responsive Grids
- [x] **Hero Banner**:
  - Image-only, art-directed `<picture>` with responsive desktop & mobile banners.
  - Viewport height calculation: `calc(100vh - var(--header-height) - var(--top-notch-height))` and `calc(100dvh - ...)`.
- [x] **Product Grids**:
  - Top Products (`isFeatured = true`, active, max 8) & Bestsellers (`isBestseller = true`, active, max 8) queried independently.
  - Responsive grid: 2 columns on mobile, 3 columns on sm-md, 4 columns on lg+.
  - `ProductCard`: compact mobile padding `p-3 sm:p-5`, 44px touch targets (`min-w-11 min-h-11`), `line-clamp-2` title, `truncate` variant.
- [x] **Reviews Carousel**:
  - Standalone `testimonials` table completely isolated from product `reviews` table (never touches JSON-LD Product aggregateRating or product rating/reviewCount).
  - WCAG-compliant controls: Previous and Next navigation buttons (44px touch target).
  - Auto-advance (4s) automatically pauses on card hover, touch, focus, tab visibility change, out of view, and `prefers-reduced-motion`.
  - Manual pause button removed per user request.
  - Dev mode displays sample testimonials with sample indicator; production mode strictly displays 0 sample testimonials.
- [x] **Closing CTA Banner**:
  - "Creating a Society Where Menstruation is Handled with Dignity" banner linking to `/about`.
- [x] **Cleaned Sections**:
  - Removed "Explore Samaura", "Our Key Initiatives" (moved to `/about`), and "Gift Collections" from home page.

### 2. Admin Testimonials Manager & Schema
- [x] Drizzle table `testimonials` (`id`, `name`, `city`, `rating`, `body`, `isPublished`, `isSample`, `sortOrder`, `createdAt`, `updatedAt`).
- [x] Migration `0005_testimonials.sql` created and tracked in journal.
- [x] Admin Testimonials Manager at `/admin/testimonials` with full CRUD, revalidation, and marketing claims scanner.
- [x] Admin Sidebar updated with Testimonials link.

### 3. Cycle Prevention & Re-entry Guards
- [x] Re-entry guard added to check scripts: exits immediately if `CHECK_RUNNING=1` is already set.
- [x] Linting decoupled: `lint` runs only via `npm run lint`; `check` runs claims + lint + tsc once; `build` runs `check-claims` and Next.js build.
- [x] Tests never invoke lint/check/build.
- [x] Zero pre/post hooks causing circular re-entry.

### 4. Verification Gates & Test Results
- [x] `npx tsc --noEmit` -> **PASSED (0 errors)**
- [x] `npm run lint` -> **PASSED (0 errors, 0 warnings)**
- [x] `npm run check-claims` -> **PASSED (0 violations)**
- [x] `npm run check-claims:db` -> **PASSED (0 violations on Turso DEV DB)**
- [x] `npm run build` -> **PASSED (45 routes compiled/prerendered)**
- [x] `tests/phase4-checkout.test.ts` -> **26 passed, 0 failed**
- [x] `tests/phase5.test.ts` -> **46 passed, 0 failed**
- [x] `tests/phase6.test.ts` -> **52 passed, 0 failed**
- [x] `tests/phase7.test.ts` -> **40 passed, 0 failed**
- [x] `tests/phase8.test.ts` -> **41 passed, 0 failed**
- [x] `tests/phase9.test.ts` -> **91 passed, 0 failed**
- [x] `tests/phase10-1.test.ts` -> **121 passed, 0 failed**
- [x] `tests/phase10-2.test.ts` -> **55 passed, 0 failed**
- [x] `tests/phase11.test.ts` -> **97 passed, 0 failed**
- [x] **Total: 569 automated assertions passed, 0 failed**










