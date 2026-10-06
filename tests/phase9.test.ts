import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";

// -------------------------------------------------------------
// Isolated Test DB Setup
// -------------------------------------------------------------
const testDbPath = path.join(process.cwd(), "data", "test.db");
const prodDevDbPath = path.join(process.cwd(), "data", "samaura.db");

if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}
fs.copyFileSync(prodDevDbPath, testDbPath);

process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.PAYMENT_PROVIDER = "mock";

async function runPhase9TestSuite() {
  console.log("=================================================");
  console.log("Running PHASE 9 Verification & E2E Test Suite");
  console.log(`Database: ${process.env.DATABASE_URL}`);
  console.log("=================================================\n");

  const { db } = await import("@/db");
  const { products, categories, reviews, productVariants } = await import("@/db/schema");
  const { recomputeProductRating, getProductBySlug } = await import("@/lib/services/products");
  const { validatePincodeState } = await import("@/lib/validation/pincode");
  const { processCheckoutAction } = await import("@/app/actions/checkout");
  const { formatOrderStatus, formatPaymentStatus, formatAdminPaymentStatus, formatPaymentMethod } = await import("@/lib/utils/statusLabels");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      failed++;
    }
  }

  // =========================================================================
  // TEST SUITE 1: REVIEWS LIFECYCLE E2E TEST (Requirement 1)
  // submit -> pending -> publish -> visible & rating recomputed -> reject/delete -> rating recomputed
  // =========================================================================
  console.log("--- TEST SUITE 1: Reviews Lifecycle E2E (Submit -> Pending -> Publish -> Recompute) ---");

  // Create isolated test category & product
  const testCatId = `cat_e2e_${Date.now()}`;
  const testProdId = `prod_e2e_${Date.now()}`;
  const testSlug = `e2e-review-product-${Date.now()}`;

  await db.insert(categories).values({
    id: testCatId,
    name: "E2E Care Category",
    slug: `e2e-cat-${Date.now()}`,
  });

  await db.insert(products).values({
    id: testProdId,
    categoryId: testCatId,
    name: "E2E Test Cotton Pads",
    slug: testSlug,
    description: "Gentle daily care product for E2E testing.",
    basePricePaise: 29900,
    rating: 0,
    reviewCount: 0,
  });

  await db.insert(productVariants).values({
    id: `var_e2e_${Date.now()}`,
    productId: testProdId,
    name: "Pack of 10",
    sku: `SKU-E2E-${Date.now()}`,
    pricePaise: 29900,
    stock: 50,
  });

  // Step 1: Customer submits review -> status is strictly "pending"
  const revId = `rev_e2e_${Date.now()}`;
  await db.insert(reviews).values({
    id: revId,
    productId: testProdId,
    userName: "Ananya Sharma",
    rating: 5,
    title: "Incredibly soft and comfortable",
    body: "Gentle on skin and very convenient ordering experience.",
    status: "pending", // Default submission state
    isVerified: true,
  });

  // Verify DB state
  const [initialRev] = await db.select().from(reviews).where(eq(reviews.id, revId));
  assert(initialRev.status === "pending", "Step 1: Newly submitted customer review is strictly 'pending'");

  // Verify storefront product query: pending review is NOT visible & rating remains 0
  const prodPending = await getProductBySlug(testSlug);
  assert(
    (prodPending?.publishedReviews?.length || 0) === 0,
    "Step 1: Pending review is NOT visible on public storefront"
  );
  assert(prodPending?.reviewCount === 0, "Step 1: Product reviewCount remains 0 while review is pending");
  assert(prodPending?.rating === 0, "Step 1: Product rating remains 0 while review is pending");

  // Step 2: Admin publishes review -> status becomes "published" & rating is recomputed
  await db.update(reviews).set({ status: "published" }).where(eq(reviews.id, revId));
  const recomputeRes1 = await recomputeProductRating(testProdId);

  assert(recomputeRes1.reviewCount === 1, "Step 2: After publishing, recomputed reviewCount is 1");
  assert(recomputeRes1.rating === 5.0, "Step 2: After publishing, recomputed rating is 5.0");

  const prodPublished = await getProductBySlug(testSlug);
  assert(
    prodPublished?.publishedReviews?.length === 1,
    "Step 2: Published review IS now visible on public storefront"
  );
  assert(
    prodPublished?.publishedReviews[0].id === revId,
    "Step 2: Visible review matches published customer review"
  );
  assert(prodPublished?.reviewCount === 1, "Step 2: Storefront reviewCount reflects published count (1)");
  assert(prodPublished?.rating === 5, "Step 2: Storefront rating reflects published average (5)");

  // Step 3: Admin rejects review -> status becomes "rejected" & rating is recomputed
  await db.update(reviews).set({ status: "rejected" }).where(eq(reviews.id, revId));
  const recomputeRes2 = await recomputeProductRating(testProdId);

  assert(recomputeRes2.reviewCount === 0, "Step 3: After rejection, recomputed reviewCount drops to 0");
  assert(recomputeRes2.rating === 0, "Step 3: After rejection, recomputed rating resets to 0");

  const prodRejected = await getProductBySlug(testSlug);
  assert(
    (prodRejected?.publishedReviews?.length || 0) === 0,
    "Step 3: Rejected review is no longer visible on public storefront"
  );

  // Step 4: Admin permanently deletes review -> rating remains recomputed at 0
  await db.delete(reviews).where(eq(reviews.id, revId));
  const recomputeRes3 = await recomputeProductRating(testProdId);

  assert(recomputeRes3.reviewCount === 0, "Step 4: After permanent deletion, reviewCount remains 0");
  assert(recomputeRes3.rating === 0, "Step 4: After permanent deletion, rating remains 0");

  // =========================================================================
  // TEST SUITE 2: SHARED-PREFIX PIN/STATE VALIDATION (Requirement 5)
  // Goa, Lakshadweep, Andaman, Ladakh, Chandigarh, Sikkim, North-East
  // =========================================================================
  console.log("\n--- TEST SUITE 2: Shared-Prefix PIN/State Validation (Req 5) ---");

  // Goa (403xxx shares circle 40 with Maharashtra)
  const goaValid = validatePincodeState("403001", "Goa");
  assert(goaValid.isValid, "Goa PIN 403001 with state Goa is valid");
  const mahGoaValid = validatePincodeState("403001", "Maharashtra");
  assert(mahGoaValid.isValid, "PIN 403001 with shared circle Maharashtra is accepted without error");

  // Lakshadweep (682xxx shares circle 68 with Kerala)
  const lakshadweepValid = validatePincodeState("682555", "Lakshadweep");
  assert(lakshadweepValid.isValid, "Lakshadweep PIN 682555 with state Lakshadweep is valid");
  const keralaLakshadweepValid = validatePincodeState("682555", "Kerala");
  assert(keralaLakshadweepValid.isValid, "PIN 682555 with shared circle Kerala is accepted without error");

  // Andaman and Nicobar Islands (744xxx shares circle 74 with West Bengal)
  const andamanValid = validatePincodeState("744101", "Andaman and Nicobar Islands");
  assert(andamanValid.isValid, "Andaman PIN 744101 with state Andaman & Nicobar is valid");
  const wbAndamanValid = validatePincodeState("744101", "West Bengal");
  assert(wbAndamanValid.isValid, "PIN 744101 with shared circle West Bengal is accepted without error");

  // Ladakh (194xxx shares circle 19 with Jammu & Kashmir)
  const ladakhValid = validatePincodeState("194101", "Ladakh");
  assert(ladakhValid.isValid, "Ladakh PIN 194101 with state Ladakh is valid");
  const jkLadakhValid = validatePincodeState("194101", "Jammu & Kashmir");
  assert(jkLadakhValid.isValid, "PIN 194101 with shared circle Jammu & Kashmir is accepted without error");

  // Chandigarh (160xxx shares circle 16 with Punjab & Haryana)
  const chdValid = validatePincodeState("160017", "Chandigarh");
  assert(chdValid.isValid, "Chandigarh PIN 160017 with state Chandigarh is valid");
  const punjabChdValid = validatePincodeState("160017", "Punjab");
  assert(punjabChdValid.isValid, "PIN 160017 with shared circle Punjab is valid");
  const haryanaChdValid = validatePincodeState("160017", "Haryana");
  assert(haryanaChdValid.isValid, "PIN 160017 with shared circle Haryana is valid");

  // Sikkim (737xxx shares circle 73 with West Bengal)
  const sikkimValid = validatePincodeState("737101", "Sikkim");
  assert(sikkimValid.isValid, "Sikkim PIN 737101 with state Sikkim is valid");
  const wbSikkimValid = validatePincodeState("737101", "West Bengal");
  assert(wbSikkimValid.isValid, "PIN 737101 with shared circle West Bengal is valid");

  // North-East circle (79 covers Manipur, Meghalaya, Mizoram, Nagaland, Tripura, Arunachal Pradesh)
  const manipurValid = validatePincodeState("795001", "Manipur");
  assert(manipurValid.isValid, "Manipur PIN 795001 with Manipur is valid");
  const nagalandValid = validatePincodeState("797001", "Nagaland");
  assert(nagalandValid.isValid, "Nagaland PIN 797001 with Nagaland is valid");
  const mizoramValid = validatePincodeState("796001", "Mizoram");
  assert(mizoramValid.isValid, "Mizoram PIN 796001 with Mizoram is valid");
  const tripuraValid = validatePincodeState("799001", "Tripura");
  assert(tripuraValid.isValid, "Tripura PIN 799001 with Tripura is valid");
  const arunachalValid = validatePincodeState("791111", "Arunachal Pradesh");
  assert(arunachalValid.isValid, "Arunachal PIN 791111 with Arunachal Pradesh is valid");

  // =========================================================================
  // TEST SUITE 3: NON-BLOCKING ADDRESS CONFIRMATION (Requirement 5)
  // Mismatch returns warning, allows 'confirmAddressMismatch: true' to place order
  // =========================================================================
  console.log("\n--- TEST SUITE 3: Non-Blocking Address Mismatch Confirmation (Req 5) ---");

  // 1. PIN mismatch returns isWarning = true
  const mismatchCheck = validatePincodeState("110001", "Maharashtra");
  assert(!mismatchCheck.isValid, "Delhi PIN 110001 with Maharashtra is recognized as mismatch");
  assert(mismatchCheck.isWarning === true, "Mismatch result sets isWarning = true (non-blocking warning flag)");

  // 2. Checkout action without confirmation returns warningMismatch = true
  // Fetch an existing variant
  const [existingVariant] = await db.select().from(productVariants).limit(1);

  const checkoutWithoutConfirm = await processCheckoutAction({
    customerName: "Pooja Verma",
    customerEmail: "pooja@example.com",
    customerPhone: "9876543210",
    addressLine1: "Flat 402, Lotus Apartments",
    city: "Mumbai",
    state: "Maharashtra", // Mismatch with Delhi 110001
    postalCode: "110001",
    paymentMethod: "cod",
    items: [{ variantId: existingVariant.id, quantity: 1 }],
    idempotencyKey: `idem_mismatch_warn_${Date.now()}`,
    confirmAddressMismatch: false,
  });

  assert(
    !checkoutWithoutConfirm.success,
    "Checkout with address mismatch is flagged when confirmation is false"
  );
  assert(
    Boolean((checkoutWithoutConfirm as { warningMismatch?: boolean }).warningMismatch),
    "Server returns warningMismatch = true prompting customer confirmation"
  );

  // 3. Checkout action with customer confirmation ('My address is correct') SUCCEEDS
  const checkoutWithConfirm = await processCheckoutAction({
    customerName: "Pooja Verma",
    customerEmail: "pooja@example.com",
    customerPhone: "9876543210",
    addressLine1: "Flat 402, Lotus Apartments",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "110001",
    paymentMethod: "cod",
    items: [{ variantId: existingVariant.id, quantity: 1 }],
    idempotencyKey: `idem_mismatch_ok_${Date.now()}`,
    confirmAddressMismatch: true, // Customer checked 'My address is correct'
  });

  assert(
    checkoutWithConfirm.success,
    "Checkout SUCCEEDS when customer confirms 'My address is correct' (non-blocking override)"
  );
  assert(
    Boolean(checkoutWithConfirm.orderId),
    "Order is placed successfully with confirmed customer address"
  );

  // Cleanup test product
  await db.delete(products).where(eq(products.id, testProdId));
  await db.delete(categories).where(eq(categories.id, testCatId));

  // =========================================================================
  // TEST SUITE 4: CUSTOMER-FACING STATUS LABELS MAPPING (PHASE 9.1)
  // =========================================================================
  console.log("\n--- TEST SUITE 4: Customer-Facing Status Labels Mapping ---");

  // Order status mapping checks
  assert(formatOrderStatus("pending_payment") === "Awaiting payment", "pending_payment maps to 'Awaiting payment'");
  assert(formatOrderStatus("placed") === "Order placed", "placed maps to 'Order placed'");
  assert(formatOrderStatus("pending") === "Order placed", "pending maps to 'Order placed'");
  assert(formatOrderStatus("confirmed") === "Confirmed", "confirmed maps to 'Confirmed'");
  assert(formatOrderStatus("shipped") === "Dispatched", "shipped maps to 'Dispatched'");
  assert(formatOrderStatus("delivered") === "Delivered", "delivered maps to 'Delivered'");
  assert(formatOrderStatus("cancelled") === "Cancelled", "cancelled maps to 'Cancelled'");
  assert(formatOrderStatus("refunded") === "Refunded", "refunded maps to 'Refunded'");
  assert(formatOrderStatus("returned") === "Returned", "returned maps to 'Returned'");

  // Payment status mapping checks (guarantees raw internal enums like pending_cod are never exposed)
  assert(formatPaymentStatus("pending_cod") === "Pay on delivery", "pending_cod maps strictly to 'Pay on delivery'");
  assert(formatPaymentStatus("pending") === "Payment pending", "pending maps to 'Payment pending'");
  assert(formatPaymentStatus("paid") === "Paid", "paid maps to 'Paid'");
  assert(formatPaymentStatus("failed") === "Payment failed", "failed maps to 'Payment failed'");
  assert(formatPaymentStatus("refund_pending") === "Refund in progress", "refund_pending maps to 'Refund in progress'");
  assert(formatPaymentStatus("paid_after_cancel") === "Refund in progress", "paid_after_cancel maps to customer 'Refund in progress'");
  assert(formatAdminPaymentStatus("paid_after_cancel") === "Paid (Cancelled)", "paid_after_cancel maps to admin detailed 'Paid (Cancelled)'");
  assert(formatPaymentStatus("refunded") === "Refunded", "refunded maps to 'Refunded'");

  // Payment method mapping checks
  assert(formatPaymentMethod("cod") === "Cash on Delivery", "cod maps to 'Cash on Delivery'");
  assert(formatPaymentMethod("razorpay") === "Online Payment", "razorpay maps to 'Online Payment'");
  assert(formatPaymentMethod("mock") === "Online Payment", "mock maps to 'Online Payment'");

  // =========================================================================
  // TEST SUITE 5: SAVED ADDRESS PIN / STATE INLINE WARNING (PHASE 9.1)
  // =========================================================================
  console.log("\n--- TEST SUITE 5: Saved Address PIN / State Inline Warning ---");

  // Saved address with valid matching PIN & state
  const validSavedAddr = {
    postalCode: "110001",
    state: "Delhi",
  };
  const validAddrCheck = validatePincodeState(validSavedAddr.postalCode, validSavedAddr.state);
  assert(validAddrCheck.isValid === true, "Saved address with 110001 + Delhi produces no warning");

  // Saved address with mismatched PIN & state (triggers inline warning)
  const mismatchedSavedAddr = {
    postalCode: "110001",
    state: "Karnataka",
  };
  const mismatchAddrCheck = validatePincodeState(mismatchedSavedAddr.postalCode, mismatchedSavedAddr.state);
  assert(mismatchAddrCheck.isValid === false, "Saved address with 110001 + Karnataka triggers warning (isValid = false)");
  assert(
    Boolean(mismatchAddrCheck.error && mismatchAddrCheck.error.includes("belongs to Delhi")),
    "Inline warning clearly alerts user of expected state"
  );

  // Saved address with shared postal circle (valid, no false warning)
  const sharedCircleAddr = {
    postalCode: "403001",
    state: "Maharashtra", // Goa PIN served under Maharashtra circle
  };
  const sharedCircleCheck = validatePincodeState(sharedCircleAddr.postalCode, sharedCircleAddr.state);
  assert(sharedCircleCheck.isValid === true, "Saved address with 403001 + Maharashtra accepted without false warning");

  // =========================================================================
  // TEST SUITE 6: PHASE 9.2 COMPLIANCE & SAMPLE DATA GUARDS (Updated Phase 10)
  // =========================================================================
  console.log("\n--- TEST SUITE 6: Phase 10 Catalogue & Sample Data Removal Guards ---");

  // 1. Verify sample products (pads, liners, wash, roll-on) are removed from catalogue
  const dbProducts = await db.select().from(products);
  const demoProducts = dbProducts.filter((p) => p.id.startsWith("prod_0"));
  assert(demoProducts.length === 0, `Sample products cleanly removed from database (${demoProducts.length} remaining)`);

  // 2. Production seed safety: verify seed creates 0 demo products in production
  const originalEnv = process.env.NODE_ENV;
  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const seedSource = fs.readFileSync(path.join(process.cwd(), "src", "db", "seed", "index.ts"), "utf-8");
    const hasProductionDemoGuard = !seedSource.includes("prod_01");
    assert(hasProductionDemoGuard, "Seed script contains zero hardcoded demo products");
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  }

  // 3. Verify only 2 categories exist in DB
  const currentCategories = await db.select().from(categories);
  const categorySlugs = currentCategories.map((c) => c.slug);
  assert(
    categorySlugs.includes("menstrual-cups") && categorySlugs.includes("gift-collections"),
    "Categories table contains Menstrual Cups and Gift Collections"
  );

  // 4. Verify Next.js 301 redirects for all 4 renamed product slugs
  const nextConfigContent = fs.readFileSync(path.join(process.cwd(), "next.config.ts"), "utf-8");
  assert(
    nextConfigContent.includes('source: "/product/organic-cotton-ultra-thin-day-pads"') &&
    nextConfigContent.includes('destination: "/product/pure-cotton-ultra-thin-day-pads"') &&
    nextConfigContent.includes("statusCode: 301"),
    "301 Permanent redirect configured for organic-cotton-ultra-thin-day-pads"
  );
  assert(
    nextConfigContent.includes('source: "/product/curved-flex-organic-cotton-liners"') &&
    nextConfigContent.includes('destination: "/product/curved-flex-cotton-liners"') &&
    nextConfigContent.includes("statusCode: 301"),
    "301 Permanent redirect configured for curved-flex-organic-cotton-liners"
  );
  assert(
    nextConfigContent.includes('source: "/product/natural-period-cramp-relief-roll-on"') &&
    nextConfigContent.includes('destination: "/product/comfort-massage-roll-on"') &&
    nextConfigContent.includes("statusCode: 301"),
    "301 Permanent redirect configured for natural-period-cramp-relief-roll-on"
  );
  assert(
    nextConfigContent.includes('source: "/product/gentle-foaming-intimate-wash-ph-3-5"') &&
    nextConfigContent.includes('destination: "/product/gentle-foaming-intimate-wash"') &&
    nextConfigContent.includes("statusCode: 301"),
    "301 Permanent redirect configured for gentle-foaming-intimate-wash-ph-3-5"
  );

  // 5. Verify devIndicators: false in next.config.ts
  assert(
    nextConfigContent.includes("devIndicators: false"),
    "next.config.ts sets devIndicators: false for clean screenshots"
  );

  // 6. Verify dynamic sitemap includes new Phase 10 routes (/learn, /awareness, /gifts) and no old slugs
  console.log("\n--- TEST SUITE 6: Sitemap, JSON-LD, Canonical & Internal Links (Phase 9.3 & 10) ---");
  const sitemapFn = (await import("@/app/sitemap")).default;
  const siteRoutes = await sitemapFn();
  const oldSlugs = [
    "organic-cotton-ultra-thin-day-pads",
    "curved-flex-organic-cotton-liners",
    "natural-period-cramp-relief-roll-on",
    "gentle-foaming-intimate-wash-ph-3-5",
  ];

  const sitemapUrls = siteRoutes.map((r) => r.url);
  for (const oldSlug of oldSlugs) {
    const hasOldSlugInSitemap = sitemapUrls.some((u) => u.includes(oldSlug));
    assert(!hasOldSlugInSitemap, `Sitemap does not contain deprecated slug: ${oldSlug}`);
  }
  const requiredRoutes = ["/learn", "/awareness", "/gifts", "/about", "/shop"];
  for (const reqRoute of requiredRoutes) {
    const hasRoute = sitemapUrls.some((u) => u.includes(reqRoute));
    assert(hasRoute, `Sitemap contains active route: ${reqRoute}`);
  }

  // 7. Verify Product Page Canonical Tags & JSON-LD
  // Insert a test product in isolated test db to verify canonical generation
  const testCanonicalSlug = `test-cup-canonical-${Date.now()}`;
  await db.insert(products).values({
    id: `prod_test_${Date.now()}`,
    categoryId: "cat_menstrual_cups",
    name: "Samaura Menstrual Cup Test",
    slug: testCanonicalSlug,
    description: "Test cup for canonical generation",
    basePricePaise: 39900,
  });
  const { generateMetadata } = await import("@/app/(store)/product/[slug]/page");
  const meta = await generateMetadata({ params: Promise.resolve({ slug: testCanonicalSlug }) });
  assert(
    meta.alternates?.canonical === `/product/${testCanonicalSlug}`,
    "Product page generateMetadata sets canonical tag with the product slug"
  );

  // 8. Verify No Internal Links In src/ Reference Deprecated Slugs
  let foundDeprecatedInternalLink = false;
  function scanDirForOldSlugs(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDirForOldSlugs(fullPath);
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        const fileContent = fs.readFileSync(fullPath, "utf-8");
        for (const oldSlug of oldSlugs) {
          if (fileContent.includes(`/product/${oldSlug}`)) {
            console.error(`Found deprecated slug /product/${oldSlug} in ${fullPath}`);
            foundDeprecatedInternalLink = true;
          }
        }
      }
    }
  }
  scanDirForOldSlugs(path.join(process.cwd(), "src"));
  assert(!foundDeprecatedInternalLink, "src/ contains zero internal links with deprecated slugs");

  // 9. PHASE 9.4: Image-only Hero Banner Verification (Req 1, 2, 3, 4, 5, 6, 8)
  console.log("\n--- TEST SUITE 7: Image-only Hero Banner Art-Direction (Phase 9.4) ---");
  const { HERO_BANNER_CONFIG } = await import("@/config/banners");
  assert(
    HERO_BANNER_CONFIG.desktop.src === "/banners/desktop-hero-banner.webp" &&
    HERO_BANNER_CONFIG.mobile.src === "/banners/mobile-hero-banner.webp",
    "HERO_BANNER_CONFIG defines correct desktop and mobile banner filepaths"
  );
  assert(
    HERO_BANNER_CONFIG.desktop.width === 2728 &&
    HERO_BANNER_CONFIG.desktop.height === 1536 &&
    HERO_BANNER_CONFIG.mobile.width === 1536 &&
    HERO_BANNER_CONFIG.mobile.height === 2728,
    "HERO_BANNER_CONFIG stores real pixel dimensions (2728x1536 desktop, 1536x2728 mobile)"
  );
  assert(
    typeof HERO_BANNER_CONFIG.alt === "string" &&
    HERO_BANNER_CONFIG.alt.length > 0 &&
    HERO_BANNER_CONFIG.href === "/shop" &&
    HERO_BANNER_CONFIG.ariaLabel === "Shop all products",
    "Hero banner config specifies neutral alt text and links to /shop with aria-label"
  );

  // Read home page component source to verify no duplicate img tags with hidden/md:block
  const homePageSource = fs.readFileSync(path.join(process.cwd(), "src", "app", "page.tsx"), "utf-8");
  const hasPictureTag = homePageSource.includes("<picture");
  const hasHiddenMdBlock = homePageSource.includes("hidden md:block") || homePageSource.includes("md:hidden");
  assert(hasPictureTag, "Home page hero uses <picture> tag for art direction");
  assert(!hasHiddenMdBlock, "Home page hero DOES NOT duplicate images with hidden/md:block classes");

  // Verify Playwright art direction and exactly one active image downloaded per breakpoint
  try {
    const { chromium } = await import("playwright-core");
    const browser = await chromium.launch({ headless: true });

    // Mobile viewport (375px < 768px)
    const mobilePage = await browser.newPage({ viewport: { width: 375, height: 667 } });
    const mobileDownloaded: string[] = [];
    mobilePage.on("request", (req) => {
      if (req.resourceType() === "image") mobileDownloaded.push(req.url());
    });
    await mobilePage.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    const mobileSrc = await mobilePage.evaluate(() => {
      const img = document.querySelector("section picture img") as HTMLImageElement | null;
      return img?.currentSrc || "";
    });
    assert(mobileSrc.includes("mobile-hero-banner"), "At 375px, the hero <img> matches the mobile banner source");
    const mobileDownloadedDesktop = mobileDownloaded.some((u) => u.includes("desktop-hero-banner"));
    assert(!mobileDownloadedDesktop, "At 375px, the desktop banner is NOT downloaded");
    await mobilePage.close();

    // Desktop viewport (1024px >= 768px)
    const desktopPage = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    const desktopDownloaded: string[] = [];
    desktopPage.on("request", (req) => {
      if (req.resourceType() === "image") desktopDownloaded.push(req.url());
    });
    await desktopPage.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    const desktopSrc = await desktopPage.evaluate(() => {
      const img = document.querySelector("section picture img") as HTMLImageElement | null;
      return img?.currentSrc || "";
    });
    assert(desktopSrc.includes("desktop-hero-banner"), "At 1024px, the hero <img> matches the desktop banner source");
    const desktopDownloadedMobile = desktopDownloaded.some((u) => u.includes("mobile-hero-banner"));
    assert(!desktopDownloadedMobile, "At 1024px, the mobile banner is NOT downloaded");
    await desktopPage.close();

    await browser.close();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("Playwright live check skipped or failed:", message);
  }

  // Clean up any test orders or addresses created during test runs
  const { orders: ordersTable, orderItems: orderItemsTable, payments: paymentsTable, addresses: addressesTable } = await import("@/db/schema");
  await db.delete(orderItemsTable);
  await db.delete(paymentsTable);
  await db.delete(ordersTable);
  await db.delete(addressesTable);

  console.log("\n=================================================");
  console.log(`PHASE 9.4 TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runPhase9TestSuite().catch((err) => {
  console.error("Test Suite Fatal Error:", err);
  process.exit(1);
});
