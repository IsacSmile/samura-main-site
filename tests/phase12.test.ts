import path from "node:path";
import { chromium } from "playwright-core";

const CHROMIUM_PATH = path.join(
  process.env.HOME || "/home/faiz",
  ".cache/ms-playwright/chromium-1243/chrome-linux64/chrome"
);

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const VIEWPORTS = [320, 360, 375, 390, 414, 768, 1024, 1280, 1536];

const STATIC_PAGES = [
  "/about",
  "/faq",
  "/learn",
  "/awareness",
  "/gifts",
  "/blog",
  "/privacy",
  "/terms",
  "/shipping-returns",
];

// Regex matching emoji code points, variation selectors, zero-width joiners, keycaps
const EMOJI_REGEX =
  /[\p{Extended_Pictographic}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F7FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\uFE00-\uFE0F\u200D\u20E3]/u;

async function runPhase12TestSuite() {
  console.log("=================================================");
  console.log("Running PHASE 12 UI Redesign & Bug Fix Verification");
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

  const browser = await chromium.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
  });

  try {
    // -------------------------------------------------------------
    // TEST SUITE 1: No literal "&amp;" in visible output of 9 pages
    // -------------------------------------------------------------
    console.log("--- Test Suite 1: No literal '&amp;' in visible output ---");
    const stdContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await stdContext.newPage();

    for (const route of STATIC_PAGES) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
      const visibleText = await page.innerText("body");
      const hasLiteralAmp = visibleText.includes("&amp;");
      assert(!hasLiteralAmp, `${route} does not contain literal '&amp;' in visible text`);
    }

    // -------------------------------------------------------------
    // TEST SUITE 2: Announcement Bar strips emojis at render time
    // -------------------------------------------------------------
    console.log("\n--- Test Suite 2: Announcement bar emoji stripping ---");
    await page.goto(`${BASE_URL}/learn`, { waitUntil: "networkidle" });
    const announcementBarText = await page.evaluate(() => {
      const bar = document.querySelector(".bg-brand");
      return bar ? bar.textContent || "" : "";
    });
    const hasAnnouncementEmoji = EMOJI_REGEX.test(announcementBarText);
    assert(
      !hasAnnouncementEmoji,
      `Announcement bar text contains no emojis (Text: "${announcementBarText.trim().replace(/\s+/g, " ")}")`
    );

    // -------------------------------------------------------------
    // TEST SUITE 3: /learn and /awareness rendered HTML checks
    // -------------------------------------------------------------
    console.log("\n--- Test Suite 3: /learn & /awareness rendered HTML checks ---");
    for (const route of ["/learn", "/awareness"]) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });

      // No emoji in main content
      const mainText = await page.evaluate(() => {
        const m = document.querySelector("main");
        return m ? m.textContent || "" : "";
      });
      const hasEmoji = EMOJI_REGEX.test(mainText);
      assert(!hasEmoji, `${route} main content has no emoji code points`);

      // Exactly one H1 per page
      const h1Count = await page.evaluate(() => document.querySelectorAll("h1").length);
      assert(h1Count === 1, `${route} has exactly one <h1> element (found: ${h1Count})`);

      // Check single title and lead (no duplication)
      const h1Text = await page.evaluate(() => {
        const h1 = document.querySelector("h1");
        return h1 ? (h1.textContent || "").trim() : "";
      });

      const bodyContent = await page.evaluate(() => {
        const prose = document.querySelector(".prose");
        return prose ? prose.textContent || "" : "";
      });

      // Body must not start with the H1 text again
      const isTitleDuplicated =
        h1Text.length > 0 &&
        bodyContent.trim().toLowerCase().startsWith(h1Text.toLowerCase());
      assert(!isTitleDuplicated, `${route} does not duplicate title in body`);

      // Check lead duplication
      const heroLeadText = await page.evaluate(() => {
        const leadP = document.querySelector("header p.text-muted");
        return leadP ? (leadP.textContent || "").trim() : "";
      });

      const isLeadDuplicated =
        heroLeadText.length > 0 &&
        bodyContent.trim().toLowerCase().startsWith(heroLeadText.toLowerCase());
      assert(!isLeadDuplicated, `${route} does not duplicate lead in body`);

      // Semantic breadcrumb check
      const breadcrumb = await page.evaluate(() => {
        const nav = document.querySelector('nav[aria-label="Breadcrumb"]');
        return nav ? nav.textContent || "" : "";
      });
      assert(
        breadcrumb.length > 0 && breadcrumb.includes("Home"),
        `${route} has semantic breadcrumb with Home`
      );
    }

    // -------------------------------------------------------------
    // TEST SUITE 4: Horizontal Overflow & scrollLeft = 0 across 9 widths
    // -------------------------------------------------------------
    console.log("\n--- Test Suite 4: Horizontal overflow check across 9 viewports ---");
    await stdContext.close();

    for (const route of ["/learn", "/awareness"]) {
      for (const width of VIEWPORTS) {
        const vpContext = await browser.newContext({
          viewport: { width, height: 750 },
          isMobile: width < 768,
        });
        const vpPage = await vpContext.newPage();
        await vpPage.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });

        const overflow = await vpPage.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = docEl.clientWidth;
          const scrollLeft = window.scrollX || docEl.scrollLeft || 0;
          return {
            scrollWidth,
            clientWidth,
            scrollLeft,
            hasOverflow: scrollWidth > clientWidth + 1, // allow 1px subpixel rounding
          };
        });

        assert(
          !overflow.hasOverflow && overflow.scrollLeft === 0,
          `${route} at ${width}px: no overflow (scrollWidth: ${overflow.scrollWidth}, clientWidth: ${overflow.clientWidth}, scrollLeft: ${overflow.scrollLeft})`
        );

        await vpContext.close();
      }
    }

    // -------------------------------------------------------------
    // TEST SUITE 5: Header controls elementFromPoint & clicks at 375px
    // -------------------------------------------------------------
    console.log("\n--- Test Suite 5: Header controls elementFromPoint & clicks at 375px ---");
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 750 },
      isMobile: true,
      hasTouch: true,
    });

    const controls = [
      { name: "menu", selector: 'header button[aria-label="Toggle Navigation Menu"]' },
      { name: "logo", selector: 'header a[href="/"]' },
      { name: "search", selector: 'header button[aria-label="Search products"]' },
      { name: "account", selector: 'header a[aria-label="My Account"]' },
      { name: "cart", selector: 'header button[aria-label="View Shopping Cart"]' },
    ];

    for (const route of ["/learn", "/awareness"]) {
      const mobPage = await mobileContext.newPage();
      await mobPage.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });

      for (const ctrl of controls) {
        const hitResult = await mobPage.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return { found: false, matches: false };
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const hit = document.elementFromPoint(cx, cy);
          const matches = hit === el || (hit ? el.contains(hit) : false);
          return {
            found: true,
            matches,
            hitTag: hit ? hit.tagName : "null",
          };
        }, ctrl.selector);

        assert(
          hitResult.found && hitResult.matches,
          `${route} at 375px: ${ctrl.name} returns itself from elementFromPoint`
        );
      }

      // Test clicking menu button
      const menuBtn = mobPage.locator('header button[aria-label="Toggle Navigation Menu"]');
      await menuBtn.click();
      await mobPage.waitForTimeout(350);
      const isDrawerOpen = await mobPage.evaluate(() => {
        const drawer = document.querySelector("header .xl\\:hidden.grid");
        const style = drawer ? window.getComputedStyle(drawer) : null;
        return document.body.style.overflow === "hidden" && style?.visibility !== "hidden";
      });
      assert(isDrawerOpen, `${route} at 375px: clicking menu successfully opens navigation drawer`);

      // Close menu by clicking toggle button again
      await menuBtn.click();
      await mobPage.waitForTimeout(350);

      // Test clicking search button
      const searchBtn = mobPage.locator('header button[aria-label="Search products"]');
      await searchBtn.click();
      await mobPage.waitForTimeout(350);
      const isSearchOpen = await mobPage.evaluate(() => {
        const overlay = document.querySelector('input[placeholder*="Search" i], [aria-label="Search products modal"]');
        return overlay !== null || document.body.style.overflow === "hidden";
      });
      assert(isSearchOpen, `${route} at 375px: clicking search opens search input/overlay`);

      // Close search
      const closeSearchBtn = mobPage.locator('button[aria-label="Close search"]');
      if (await closeSearchBtn.count() > 0) {
        await closeSearchBtn.click();
        await mobPage.waitForTimeout(350);
      }

      // Test clicking cart button
      const cartBtn = mobPage.locator('header button[aria-label="View Shopping Cart"]');
      await cartBtn.click();
      await mobPage.waitForTimeout(350);
      const isCartOpen = await mobPage.evaluate(() => {
        return document.body.style.overflow === "hidden";
      });
      assert(isCartOpen, `${route} at 375px: clicking cart opens cart drawer`);

      // Close cart
      const closeCartBtn = mobPage.locator('button[aria-label="Close cart drawer"], button[aria-label="Close"]');
      if (await closeCartBtn.count() > 0) {
        await closeCartBtn.first().click();
        await mobPage.waitForTimeout(350);
      }

      await mobPage.close();
    }
    await mobileContext.close();

    // -------------------------------------------------------------
    // TEST SUITE 6: Reduced Motion & JavaScript-Disabled renders
    // -------------------------------------------------------------
    console.log("\n--- Test Suite 6: Reduced motion & JavaScript-disabled renders ---");

    // Reduced motion
    const rmContext = await browser.newContext({
      viewport: { width: 1024, height: 768 },
      reducedMotion: "reduce",
    });
    const rmPage = await rmContext.newPage();
    for (const route of ["/learn", "/awareness"]) {
      await rmPage.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
      const isVisible = await rmPage.evaluate(() => {
        const main = document.querySelector("main");
        if (!main) return false;
        const style = window.getComputedStyle(main);
        return style.opacity !== "0" && style.display !== "none";
      });
      assert(isVisible, `${route} renders fully visible under prefers-reduced-motion`);
    }
    await rmContext.close();

    // JS Disabled
    const noJsContext = await browser.newContext({
      viewport: { width: 1024, height: 768 },
      javaScriptEnabled: false,
    });
    const noJsPage = await noJsContext.newPage();
    for (const route of ["/learn", "/awareness"]) {
      await noJsPage.goto(`${BASE_URL}${route}`, { waitUntil: "commit" });
      await noJsPage.waitForTimeout(500);
      const bodyText = await noJsPage.innerText("body");
      assert(
        bodyText.length > 100 && !bodyText.includes("&amp;"),
        `${route} renders complete content with JavaScript disabled`
      );
    }
    await noJsContext.close();

  } finally {
    await browser.close();
  }

  console.log("\n=================================================");
  console.log(`PHASE 12 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase12TestSuite().catch((err) => {
  console.error("Unhandled error in Phase 12 test suite:", err);
  process.exit(1);
});
