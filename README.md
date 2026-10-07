# Samaura Healthcare — Production E-Commerce Platform

Samaura Healthcare is an enterprise-grade e-commerce web application for plant-derived female hygiene care. Built on Next.js 16 (App Router), React 19, TypeScript strict mode, Tailwind CSS v4, LibSQL / SQLite with Drizzle ORM, NextAuth (Auth.js v5), Razorpay payments, and Resend email infrastructure.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components & Actions)
- **UI Library**: [React 19](https://react.dev/) + [Tailwind CSS v4](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Database & ORM**: [LibSQL / SQLite](https://turso.tech/) + [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Auth.js (NextAuth v5)](https://authjs.dev/) with bcrypt hashing & role-based authorization
- **Payments**: [Razorpay](https://razorpay.com/) (Cards, UPI, Net Banking) + Cash on Delivery (COD)
- **Email Service**: [Resend](https://resend.com/) transactional email integration
- **Validation**: [Zod](https://zod.dev/) schema validation
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) for cart & UI state

---

## ✨ Key Features

- **Storefront & Catalog**: Category navigation, product filtering, dynamic variants, inventory tracking, customer reviews moderation, and structured JSON-LD schemas.
- **Cart & Dynamic Checkout**: Dynamic cart drawer, coupon code validation, atomic stock lock in 1 DB transaction, and automatic shipping rate calculation.
- **Admin Control Panel**: Comprehensive metrics dashboard, product & variant manager, order processing state machine, customer management, coupons CRUD, banner manager, and CMS page editor.
- **Order State Machine**: Status tracking (`pending_payment`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`) with courier tracking & restock rules.
- **Automated PDF Tax Invoices**: Printable invoice generator (`/order/[token]/invoice` & `/admin/orders/[id]/invoice`) with sequential numbering (`INV-YYYY-XXXXX`).
- **Email Dispatch System**: Transactional email templates for customer order confirmations, admin notifications, status updates, and password resets.
- **Interactive Admin Manual**: Embedded operating manual accessible at `/admin/help`.

---

## 📸 Client Photography Requirement Before Launch

> **IMPORTANT LAUNCH NOTICE FOR CLIENT (`Data_for_website.docx`):**
> In accordance with project requirements, none of the images from `Data_for_website.docx` were used. The application strictly utilizes branded typographic cards and clean SVG vector artwork across all pages.
> **The client must supply real, high-resolution photography before production launch** for Samaura Menstrual Cups, educational publications/books, and gift hampers/kits. Real photos can be uploaded via the admin panel or added to `/public`.

---

## 🛡️ Marketing & Copy Compliance Guard

This codebase includes an automated compliance scanner (`scripts/check-claims.ts`) enforcing unvalidated claim prevention and terminology standards.
- Prohibited phrasing includes unverified assertions, unsupported percentages, and absolute claims.
- The guard runs automatically on `npm run check`, `npm run check-claims`, and during `npm run build`.
- To register client-authorized and substantiated phrases, add them with verification references in `config/claims-allowlist.json`.

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher

### Step 1: Clone & Install Dependencies
```bash
git clone git@github.com:IsacSmile/samura-main-site.git
cd samura-main-site
npm install
```

### Step 2: Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL="file:data/samaura.db"` is set for local development.

### Step 3: Database Migration & Seeding
Run the database migrations and populate seed data:
```bash
npm run db:migrate
npm run db:seed
```

Default Admin Credentials:
- **Email**: `admin@samaura.com`
- **Password**: `Admin@123456`

### Step 4: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Available NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Next.js development server |
| `npm run build` | Scans copy compliance and builds production bundle |
| `npm run start` | Starts Next.js production server |
| `npm run check` | Runs copy compliance scan, ESLint, and TypeScript check |
| `npm run check-claims` | Runs marketing claims scanner on source files |
| `npm run check-claims:db` | Runs marketing claims scanner on DB contents |
| `npm run lint` | Runs ESLint analysis |
| `npm run db:migrate` | Runs Drizzle Kit database migrations |
| `npm run db:seed` | Seeds database with initial categories, products, and admin account |
| `npm run db:backup` | Creates timestamped local SQLite backup in `backups/` |
| `npm run db:backup:turso` | Downloads point-in-time snapshot from Turso DB |

---

## 🚀 Deployment Options

### Option A: Vercel + Turso Cloud (Recommended Serverless Architecture)

#### Step 1: Create a Turso Database
1. Install Turso CLI or log in at [turso.tech](https://turso.tech).
2. Create your database:
   ```bash
   turso db create samaura-prod
   ```
3. Generate a long-lived database auth token:
   ```bash
   turso db tokens create samaura-prod
   ```
4. Copy the database URL (e.g. `libsql://samaura-prod-yourorg.turso.io`) and auth token.

#### Step 2: Push Database Migrations to Turso
Run migrations against the remote Turso database:
```bash
DATABASE_URL="libsql://samaura-prod-yourorg.turso.io" \
DATABASE_AUTH_TOKEN="<your-auth-token>" \
npm run db:migrate
```

#### Step 3: Seed Initial Data
Seed the production catalog, shipping rules, and admin user:
```bash
NODE_ENV="production" \
DATABASE_URL="libsql://samaura-prod-yourorg.turso.io" \
DATABASE_AUTH_TOKEN="<your-auth-token>" \
SEED_ADMIN_EMAIL="admin@samaura.com" \
SEED_ADMIN_PASSWORD="YourStrongAdminPassword123!" \
npm run db:seed
```

#### Step 4: Deploy to Vercel
1. Import the repository in [vercel.com](https://vercel.com).
2. Configure Build & Development settings:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
3. Add Production Environment Variables in Vercel project settings (see Environment Variables Table below).
4. Deploy!

---

### Option B: VPS Self-Hosting (Docker + Caddy + SQLite)

#### Step 1: Dockerfile
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci

COPY . .
ENV NODE_ENV=production
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

#### Step 2: Caddy Reverse Proxy & SSL (`Caddyfile`)
```caddy
samaura.com, www.samaura.com {
    encode gzip zstd
    reverse_proxy localhost:3000 {
        trusted_proxies private_ranges
    }

    header {
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
```

---

## 🔒 Rate Limiting & Trusted Proxy Configuration

Samaura derives client IP addresses strictly from trusted reverse proxy headers:

1. **Vercel**: Evaluates `x-vercel-forwarded-for` and `x-real-ip` provided by the Vercel Edge Network.
2. **Caddy / Nginx**: Evaluates the client IP in `x-forwarded-for` only when forwarded from configured `trusted_proxies`. Ensure your reverse proxy strips untrusted client-supplied headers.

Expired rate limit records are automatically pruned via a background sweeping utility in `src/lib/rateLimit.ts`.

---

## 💾 Database Backup Procedures

### 1. Local SQLite Backup (Development / VPS)
Creates a timestamped snapshot of `data/samaura.db` in `backups/`:
```bash
npm run db:backup
```

### 2. Turso Cloud Database Backup (Production)
Dumps the point-in-time schema and data from Turso using the Turso CLI:
```bash
npm run db:backup:turso
```
Or manually run:
```bash
turso db shell samaura-prod .dump > backups/turso-dump-$(date +%F).sql
```

---

## 🛡️ Razorpay CSP Directives

The Content-Security-Policy header in `next.config.ts` includes the required Razorpay directives:
- **`script-src`**: `'self'` `'unsafe-inline'` `'unsafe-eval'` `https://checkout.razorpay.com`
- **`frame-src`**: `'self'` `https://api.razorpay.com` `https://checkout.razorpay.com`
- **`connect-src`**: `'self'` `https://api.razorpay.com` `https://lumberjack.razorpay.com`

---

## 🔐 Environment Variables Reference Table

| Variable Name | Required | Default / Description |
|---|---|---|
| `DATABASE_URL` | **Yes** | `file:data/samaura.db` for local SQLite or `libsql://...` for Turso |
| `DATABASE_AUTH_TOKEN` | Turso only | Auth token generated via `turso db tokens create` |
| `AUTH_SECRET` | **Yes in prod** | Random 64-char hex key: `openssl rand -hex 32` |
| `NEXTAUTH_URL` | Optional | Canonical URL (e.g. `https://samaura.com`) |
| `NEXT_PUBLIC_SITE_URL` | **Yes in prod** | Public storefront URL (e.g. `https://samaura.com`) |
| `PAYMENT_PROVIDER` | Optional | `cod` (default), `mock` (dev only), or `razorpay` |
| `RAZORPAY_KEY_ID` | When online enabled | Razorpay Key ID (`rzp_live_...` or `rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | When online enabled | Razorpay Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | When online enabled | Razorpay Webhook Secret for HMAC verification |
| `RESEND_API_KEY` | Optional | Resend API Key (`re_...`). Logs to console if unset |
| `RESEND_FROM_EMAIL` | Optional | Outbound authorized sender (`orders@samaura.com`) |
| `ADMIN_ALERT_EMAIL` | Optional | Recipient for new order admin alerts (`admin@samaura.com`) |
| `STORAGE_PROVIDER` | Optional | `local` (default) or `cloudinary` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary only | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary only | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary only | Cloudinary API secret |
| `NEXT_PUBLIC_GA_ID` | Optional | Google Analytics Measurement ID (`G-XXXXXXXXXX`) |

---

## 🌐 Domain, DNS & Email Authentication

### DNS Records (Cloudflare, Route53, Namecheap)
- **Apex domain**: `A` record pointing to Vercel IP (`76.76.21.21`) or VPS IP.
- **www subdomain**: `CNAME` pointing to `cname.vercel-dns.com` or apex.

### Resend Email Setup
To ensure transactional emails reach the customer inbox:
1. Verify domain in [resend.com/domains](https://resend.com/domains).
2. Add DNS records:
   - **DKIM**: `TXT` record with hostname `resend._domainkey.samaura.com`.
   - **SPF**: `TXT` record for `bounces.samaura.com` with `v=spf1 include:amazonses.com ~all`.
   - **DMARC**: `TXT` record for `_dmarc.samaura.com` with `v=DMARC1; p=none; rua=mailto:dmarc@samaura.com`.

---

## 💳 Razorpay Go-Live Checklist

1. **KYC Verification**: Ensure business KYC is confirmed on Razorpay dashboard.
2. **Switch to Live Mode**: Toggle switch from Test to Live.
3. **Generate Live Keys**: Under Settings > API Keys, generate Live Key ID & Secret.
4. **Register Webhook**:
   - URL: `https://samaura.com/api/razorpay/webhook`
   - Secret: Matches `RAZORPAY_WEBHOOK_SECRET`
   - Active Events: `payment.captured`, `payment.failed`, `order.paid`
5. **Set Environment Variables**: Set `PAYMENT_PROVIDER="razorpay"` and deploy.

---

## 🧪 Post-Deploy Smoke Test Checklist

- [ ] **Home Page**: Verify hero banner, product grid, neutral copy, and footer links.
- [ ] **Catalog & Filters**: Check `/shop` pagination, category filtering, and product details.
- [ ] **Cart Flow**: Add variant to cart, check price calculation and free shipping threshold.
- [ ] **Checkout (COD)**: Submit test COD order, verify order receipt number `INV-YYYY-XXXXX`.
- [ ] **Checkout (Online)**: Complete test Razorpay payment, verify instant payment confirmation.
- [ ] **Customer Account**: Register user, verify single-use email verification token.
- [ ] **Admin Console**: Log in to `/admin` using admin credentials.
- [ ] **Order Fulfillment**: Dispatch order with courier name & tracking number; verify customer update email.
- [ ] **Security**: Verify `Content-Security-Policy`, `X-Frame-Options: DENY`, `no-referrer` on reset password.
- [ ] **Responsive Audit**: Check on mobile (320px–414px) and desktop (1280px–1536px) for zero horizontal overflow.

---

## ⏪ Rollback Procedure

### Rollback on Vercel
1. Go to **Deployments** in Vercel.
2. Locate the previous stable deployment.
3. Click **...** > **Promote to Production** (Instant traffic switch).

### Database Rollback
1. Before running breaking migrations, create a backup:
   ```bash
   npm run db:backup
   ```
2. In case of issues, restore the SQLite backup or re-point Turso to a previous point-in-time branch:
   ```bash
   turso db restore samaura-prod --timestamp 2026-10-06T00:00:00Z
   ```
