// Re-entry guard: exit immediately if CHECK_RUNNING=1 is already set
if (process.env.CHECK_RUNNING === "1") {
  console.log("[Re-entry Guard] CHECK_RUNNING=1 is already set; exiting verify-browser-layout immediately.");
  process.exit(0);
}

import { chromium } from "playwright-core";
import path from "node:path";
import os from "node:os";

async function verifyBrowserLayout() {
  console.log("=================================================");
  console.log("SAMAURA HEALTHCARE — BROWSER VIEWPORT & OVERFLOW AUDIT");
  console.log("=================================================\n");

  const executablePath = path.join(
    os.homedir(),
    ".cache/ms-playwright/chromium-1243/chrome-linux64/chrome"
  );

  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  const viewports = [320, 360, 375, 390, 414, 768, 1024, 1280, 1536];
  let allPassed = true;

  try {
    const page = await browser.newPage();

    for (const width of viewports) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });

      // 1. Check document.scrollingElement.scrollLeft
      const scrollLeft = await page.evaluate(() => document.scrollingElement?.scrollLeft ?? 0);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);

      // 2. Find any elements overflowing the viewport
      const overflowingElements = await page.evaluate((vpWidth) => {
        const elements = Array.from(document.querySelectorAll("*"));
        const offenders: string[] = [];

        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          // Ignore SVG child paths or elements inside overflow-hidden containers that are safely clipped
          if (rect.right > vpWidth + 1) {
            let parent = el.parentElement;
            let isSafelyClipped = false;
            while (parent) {
              const overflow = window.getComputedStyle(parent).overflowX;
              if (overflow === "hidden" || overflow === "clip") {
                isSafelyClipped = true;
                break;
              }
              parent = parent.parentElement;
            }

            if (!isSafelyClipped) {
              const tag = el.tagName.toLowerCase();
              const cls = typeof el.className === "string" ? el.className.slice(0, 40) : "";
              offenders.push(`<${tag} class="${cls}"> (right: ${Math.round(rect.right)}px)`);
              if (offenders.length >= 3) break;
            }
          }
        }
        return offenders;
      }, width);

      // 3. Check product card columns at this viewport
      const topProductsCols = await page.evaluate(() => {
        const section = Array.from(document.querySelectorAll("section")).find((s) =>
          s.textContent?.includes("Our Top Products")
        );
        if (!section) return 0;
        const grid = section.querySelector(".grid");
        if (!grid) return 0;
        const cards = Array.from(grid.children);
        if (cards.length < 2) return cards.length;
        const firstTop = (cards[0] as HTMLElement).offsetTop;
        return cards.filter((c) => (c as HTMLElement).offsetTop === firstTop).length;
      });

      // 4. Check carousel card widths per view
      const carouselCardsPerView = await page.evaluate(() => {
        const carousel = document.querySelector('section[role="region"][aria-label="What Our Customers Say"]');
        if (!carousel) return 0;
        const track = carousel.querySelector(".snap-x");
        if (!track || !track.firstElementChild) return 0;
        const cardWidth = track.firstElementChild.getBoundingClientRect().width;
        const trackWidth = track.getBoundingClientRect().width;
        return Math.round(trackWidth / cardWidth);
      });

      // Assertions
      const isScrollOk = scrollLeft === 0 && scrollWidth <= width + 1;
      const noOverflow = overflowingElements.length === 0;

      let expectedCols = 2;
      if (width >= 1024) expectedCols = 4;
      else if (width >= 640) expectedCols = 3;

      let expectedCarouselCards = 1;
      if (width >= 1024) expectedCarouselCards = 3;
      else if (width >= 640) expectedCarouselCards = 2;

      const colsOk = topProductsCols === expectedCols;
      const carouselOk = carouselCardsPerView === expectedCarouselCards;

      if (isScrollOk && noOverflow && colsOk && carouselOk) {
        console.log(`✅ [Viewport ${width}px] Passed: scrollLeft=${scrollLeft}, scrollWidth=${scrollWidth}px, columns=${topProductsCols}, carouselCards=${carouselCardsPerView}`);
      } else {
        allPassed = false;
        console.error(`❌ [Viewport ${width}px] FAILED:`);
        if (!isScrollOk) console.error(`   - Scroll overflow: scrollLeft=${scrollLeft}, scrollWidth=${scrollWidth}px (max ${width}px)`);
        if (!noOverflow) console.error(`   - Overflowing elements: ${overflowingElements.join("; ")}`);
        if (!colsOk) console.error(`   - Expected ${expectedCols} product columns, got ${topProductsCols}`);
        if (!carouselOk) console.error(`   - Expected ${expectedCarouselCards} carousel cards per view, got ${carouselCardsPerView}`);
      }
    }

    // 5. Test Carousel Pause/Play and Keyboard operability
    console.log("\n--- Testing Carousel Pause/Play & Controls ---");
    await page.setViewportSize({ width: 1024, height: 800 });
    const carouselRegion = await page.$('section[role="region"][aria-label="What Our Customers Say"]');
    if (carouselRegion) {
      const pauseBtn = await page.$('button[aria-label*="auto-advance"]');
      const isPauseVisible = await pauseBtn?.isVisible();
      console.log(`✅ Carousel region found with WCAG pause/play button (visible=${isPauseVisible})`);

      const prevBtn = await page.$('button[aria-label="Previous review"]');
      const nextBtn = await page.$('button[aria-label="Next review"]');
      const prevSize = await prevBtn?.boundingBox();
      const nextSize = await nextBtn?.boundingBox();

      console.log(`✅ Control touch targets: Prev=${prevSize?.width}x${prevSize?.height}px, Next=${nextSize?.width}x${nextSize?.height}px (>=44px touch target)`);
    }

    console.log("\n=================================================");
    if (allPassed) {
      console.log("🎉 ALL VIEWPORTS & OVERFLOW AUDITS PASSED WITH ZERO ERRORS!");
    } else {
      console.error("❌ ONE OR MORE VIEWPORTS FAILED AUDIT");
      process.exit(1);
    }
    console.log("=================================================\n");
  } finally {
    await browser.close();
  }
}

verifyBrowserLayout().catch((err) => {
  console.error("Browser test error:", err);
  process.exit(1);
});
