import path from "node:path";
import fs from "node:fs";
import { chromium } from "playwright-core";

const CHROMIUM_PATH = path.join(
  process.env.HOME || "/home/faiz",
  ".cache/ms-playwright/chromium-1243/chrome-linux64/chrome"
);

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const VIEWPORTS = [375, 390, 414, 768, 1280];

async function runPhase13_1TestSuite() {
  console.log("=================================================");
  console.log("Running PHASE 13.1 Product Lightbox & Trust Chips Test Suite");
  console.log("Tool: Playwright-core (Chromium 1243)");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST SUITE 1: Static Code Audit & Trust Chips Removal Check
  // -------------------------------------------------------------
  console.log("--- Test Suite 1: Trust Chips Audit on Product Page & Components ---");

  const productPageSrc = fs.readFileSync("src/app/(store)/product/[slug]/page.tsx", "utf8");
  const productCardSrc = fs.readFileSync("src/components/product/ProductCard.tsx", "utf8");
  const productAccordionSrc = fs.readFileSync("src/components/product/ProductAccordion.tsx", "utf8");
  const lightboxSrc = fs.readFileSync("src/components/product/ProductImageLightbox.tsx", "utf8");

  assert(
    !productPageSrc.includes("Gentle on Skin"),
    "Hardcoded 'Gentle on Skin' is removed from product page headline area"
  );
  assert(
    !productPageSrc.includes("Skin-Friendly Composition"),
    "Hardcoded 'Skin-Friendly Composition' is removed from product page badges area"
  );
  assert(
    !productCardSrc.includes("Gentle on Skin") && !productCardSrc.includes("Skin-Friendly Composition"),
    "ProductCard has zero hardcoded trust claim chips"
  );
  assert(
    !productAccordionSrc.includes("Skin-Friendly Composition"),
    "ProductAccordion has zero hardcoded 'Skin-Friendly Composition'"
  );
  assert(
    lightboxSrc.includes("createPortal"),
    "ProductImageLightbox uses createPortal for document.body mounting"
  );
  assert(
    lightboxSrc.includes('role="dialog"') && lightboxSrc.includes('aria-modal="true"'),
    "ProductImageLightbox has role='dialog' and aria-modal='true'"
  );

  // -------------------------------------------------------------
  // TEST SUITE 2: Real Browser Viewport & elementFromPoint Audit
  // -------------------------------------------------------------
  console.log("\n--- Test Suite 2: Real Browser Lightbox & elementFromPoint Testing ---");

  if (!fs.existsSync(CHROMIUM_PATH)) {
    console.error(`Chromium binary not found at ${CHROMIUM_PATH}`);
    process.exit(1);
  }

  const browser = await chromium.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
  });

  try {
    const page = await browser.newPage();

    // 1. Check trust chips absence on product without badge
    await page.goto(`${BASE_URL}/product/cup-storage-pouch`, { waitUntil: "networkidle" });
    const pouchBodyText = await page.textContent("body");
    assert(
      !pouchBodyText?.includes("Gentle on Skin"),
      "[cup-storage-pouch] No 'Gentle on Skin' chip renders when no badge is set"
    );
    assert(
      !pouchBodyText?.includes("Skin-Friendly Composition"),
      "[cup-storage-pouch] No 'Skin-Friendly Composition' chip renders when no badge is set"
    );

    // 2. Test products: 1-image (/product/samaura-menstrual-cup) and 3-image (/product/faiz-test-product)
    const testProducts = [
      { slug: "samaura-menstrual-cup", expectedImages: 1 },
      { slug: "faiz-test-product", expectedImages: 3 },
    ];

    for (const testProd of testProducts) {
      console.log(`\nTesting product: /product/${testProd.slug} (${testProd.expectedImages} image/s)...`);

      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp, height: 900 });
        await page.goto(`${BASE_URL}/product/${testProd.slug}`, { waitUntil: "networkidle" });

        // Ensure zero horizontal overflow initially
        const initialScrollLeft = await page.evaluate(() => document.scrollingElement?.scrollLeft ?? 0);
        const initialScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        assert(initialScrollLeft === 0, `[${vp}px] initial document.scrollingElement.scrollLeft is 0`);
        assert(initialScrollWidth <= vp + 1, `[${vp}px] initial document.documentElement.scrollWidth (${initialScrollWidth}px) <= viewport (${vp}px)`);

        // Click main image to open lightbox
        const mainImageButton = page.locator('div[role="button"][aria-label="Click to enlarge product image"]');
        await mainImageButton.click();

        // Wait for lightbox dialog to appear
        const lightboxDialog = page.locator('div[role="dialog"][aria-label="Product image viewer"]');
        await lightboxDialog.waitFor({ state: "visible", timeout: 3000 });
        assert(await lightboxDialog.isVisible(), `[${vp}px] Lightbox opened and visible`);

        // Verify body scroll lock
        const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
        assert(bodyOverflow === "hidden", `[${vp}px] Body scroll locked (overflow: hidden)`);

        // elementFromPoint testing at center of viewport
        const centerHit = await page.evaluate(() => {
          const cx = Math.floor(window.innerWidth / 2);
          const cy = Math.floor(window.innerHeight / 2);
          const el = document.elementFromPoint(cx, cy);
          return {
            tagName: el?.tagName,
            role: el?.getAttribute("role"),
            insideDialog: Boolean(el?.closest('div[role="dialog"]')),
            headerHit: Boolean(el?.closest("header")),
            stickyBarHit: Boolean(el?.closest(".z-sticky")),
          };
        });

        assert(centerHit.insideDialog, `[${vp}px] elementFromPoint at center is strictly inside dialog`);
        assert(!centerHit.headerHit, `[${vp}px] Center is NOT covered by header`);
        assert(!centerHit.stickyBarHit, `[${vp}px] Center is NOT covered by sticky bar`);

        // elementFromPoint at close button
        const closeBtnHit = await page.evaluate(() => {
          const btn = document.querySelector('button[aria-label="Close product image viewer"]');
          if (!btn) return { found: false, matches: false };
          const rect = btn.getBoundingClientRect();
          const cx = Math.floor(rect.left + rect.width / 2);
          const cy = Math.floor(rect.top + rect.height / 2);
          const el = document.elementFromPoint(cx, cy);
          return {
            found: true,
            matches: el === btn || btn.contains(el),
            headerHit: Boolean(el?.closest("header")),
          };
        });

        assert(closeBtnHit.found && closeBtnHit.matches, `[${vp}px] elementFromPoint at close button returns close button`);
        assert(!closeBtnHit.headerHit, `[${vp}px] Close button is NOT covered by header`);

        // Test navigation controls and counter if multi-image
        if (testProd.expectedImages > 1) {
          const counterText = await lightboxDialog.locator("#lightbox-counter").textContent();
          assert(counterText?.trim() === `1 / ${testProd.expectedImages}`, `[${vp}px] Counter reads '1 / ${testProd.expectedImages}'`);

          const nextBtn = lightboxDialog.locator('button[aria-label="Next image"]');
          assert(await nextBtn.isVisible(), `[${vp}px] Next button is visible`);

          const nextBtnHit = await page.evaluate(() => {
            const dialog = document.querySelector('div[role="dialog"][aria-label="Product image viewer"]');
            const btn = dialog?.querySelector('button[aria-label="Next image"]');
            if (!btn) return false;
            const rect = btn.getBoundingClientRect();
            const el = document.elementFromPoint(Math.floor(rect.left + rect.width / 2), Math.floor(rect.top + rect.height / 2));
            return el === btn || btn.contains(el);
          });
          assert(nextBtnHit, `[${vp}px] elementFromPoint at next button returns next button`);

          // Click next button
          await nextBtn.click();
          await page.waitForTimeout(100);
          const nextCounter = await lightboxDialog.locator("#lightbox-counter").textContent();
          assert(nextCounter?.trim() === `2 / ${testProd.expectedImages}`, `[${vp}px] Counter advances to '2 / ${testProd.expectedImages}' after clicking next`);

          // ArrowLeft key test
          await page.keyboard.press("ArrowLeft");
          await page.waitForTimeout(100);
          const backCounter = await lightboxDialog.locator("#lightbox-counter").textContent();
          assert(backCounter?.trim() === `1 / ${testProd.expectedImages}`, `[${vp}px] ArrowLeft returns counter to '1 / ${testProd.expectedImages}'`);
        }

        // Close by close button
        const closeBtn = lightboxDialog.locator('button[aria-label="Close product image viewer"]');
        await closeBtn.click();
        await lightboxDialog.waitFor({ state: "hidden", timeout: 2000 });
        assert(!(await lightboxDialog.isVisible()), `[${vp}px] Lightbox closed via close button`);

        // Verify body scroll lock released
        const overflowRestored = await page.evaluate(() => document.body.style.overflow);
        assert(overflowRestored === "", `[${vp}px] Body scroll lock released after close`);

        // Test opening and closing with Escape key
        await mainImageButton.click();
        await lightboxDialog.waitFor({ state: "visible" });
        await page.keyboard.press("Escape");
        await lightboxDialog.waitFor({ state: "hidden" });
        assert(!(await lightboxDialog.isVisible()), `[${vp}px] Lightbox closed via Escape key`);

        // Test opening and closing with backdrop click
        await mainImageButton.click();
        await lightboxDialog.waitFor({ state: "visible" });
        // Click near top-left backdrop (outside image and buttons)
        await page.mouse.click(10, 10);
        await lightboxDialog.waitFor({ state: "hidden" });
        assert(!(await lightboxDialog.isVisible()), `[${vp}px] Lightbox closed via backdrop click`);

        // Ensure header icons still work after closing
        const searchLink = page.locator('header a[href="/shop"]');
        assert(await searchLink.count() > 0, `[${vp}px] Header navigation links accessible after closing`);
      }
    }

    // Route change closure test
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto(`${BASE_URL}/product/samaura-menstrual-cup`, { waitUntil: "networkidle" });
    const mainBtn = page.locator('div[role="button"][aria-label="Click to enlarge product image"]');
    await mainBtn.click();
    const lightboxDialog = page.locator('div[role="dialog"][aria-label="Product image viewer"]');
    await lightboxDialog.waitFor({ state: "visible" });

    // Navigate to shop
    await page.goto(`${BASE_URL}/shop`, { waitUntil: "networkidle" });
    const dialogOnNewRoute = page.locator('div[role="dialog"][aria-label="Product image viewer"]');
    assert((await dialogOnNewRoute.count()) === 0, "Lightbox cleanly unmounted on route change");

  } finally {
    await browser.close();
  }

  console.log("\n=================================================");
  console.log(`PHASE 13.1 TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase13_1TestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
