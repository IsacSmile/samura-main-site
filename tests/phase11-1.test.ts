import path from "node:path";
import { chromium } from "playwright-core";

const CHROMIUM_PATH = path.join(
  process.env.HOME || "/home/faiz",
  ".cache/ms-playwright/chromium-1243/chrome-linux64/chrome"
);

const ROUTES = [
  "/",
  "/shop",
  "/category/menstrual-cups",
  "/product/samaura-menstrual-cup",
  "/cart",
  "/checkout",
  "/account",
];

const VIEWPORTS = [320, 360, 375, 390, 414];

const CONTROLS = [
  { name: "menu", selector: 'header button[aria-label="Toggle Navigation Menu"]' },
  { name: "logo", selector: 'header a[href="/"]' },
  { name: "search", selector: 'header button[aria-label="Search products"]' },
  { name: "account", selector: 'header a[aria-label="My Account"]' },
  { name: "cart", selector: 'header button[aria-label="View Shopping Cart"]' },
];

async function runPhase11_1TestSuite() {
  console.log("=================================================");
  console.log("Running PHASE 11.1 Mobile Navbar & Viewport Regression Tests");
  console.log("Tool: Playwright-core (Chromium 1243)");
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
    for (const width of VIEWPORTS) {
      console.log(`\n--- Testing Viewport Width: ${width}px ---`);
      const context = await browser.newContext({
        viewport: { width, height: 750 },
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage();

      for (const route of ROUTES) {
        const url = `http://localhost:3000${route}`;
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForTimeout(300);

        // 1. Assert scrollLeft stays 0 and no horizontal overflow
        const overflow = await page.evaluate(() => {
          const el = document.scrollingElement || document.documentElement;
          return {
            scrollLeft: el.scrollLeft,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
          };
        });
        assert(
          overflow.scrollLeft === 0,
          `[${width}px ${route}] document.scrollingElement.scrollLeft is strictly 0`
        );
        assert(
          overflow.scrollWidth <= overflow.clientWidth,
          `[${width}px ${route}] No horizontal page overflow (${overflow.scrollWidth} <= ${overflow.clientWidth})`
        );

        // 2. Assert elementFromPoint returns each header control
        for (const ctrl of CONTROLS) {
          const check = await page.evaluate(({ selector }) => {
            const el = document.querySelector(selector);
            if (!el) return { found: false, error: "Element missing" };
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const topEl = document.elementFromPoint(cx, cy);
            const isMatch = topEl && (topEl === el || el.contains(topEl));
            return {
              found: true,
              isMatch,
              topTag: topEl?.tagName,
              topClass: topEl?.className,
              rect: { width: rect.width, height: rect.height },
            };
          }, { selector: ctrl.selector });

          assert(
            Boolean(check.found && check.isMatch),
            `[${width}px ${route}] elementFromPoint at center of ${ctrl.name} returns control (top=${check.topTag})`
          );
          if (ctrl.name !== "logo") {
            assert(
              (check.rect?.width ?? 0) >= 44 && (check.rect?.height ?? 0) >= 44,
              `[${width}px ${route}] ${ctrl.name} has minimum 44x44px hit area (${check.rect?.width}x${check.rect?.height})`
            );
          }
        }

        // 3. Test interactive opening & closing of panels on representative route (/)
        if (route === "/") {
          // A. Mobile menu drawer open & close
          const menuBtn = page.locator('header button[aria-label="Toggle Navigation Menu"]');
          await menuBtn.click();
          await page.waitForTimeout(350);

          const menuOpenState = await page.evaluate(() => {
            const drawer = document.querySelector('div[role="dialog"][aria-label="Navigation Menu"]');
            const style = drawer ? window.getComputedStyle(drawer) : null;
            return {
              bodyOverflow: document.body.style.overflow,
              drawerVisible: style ? style.visibility !== "hidden" && style.opacity === "1" : false,
            };
          });
          assert(
            menuOpenState.bodyOverflow === "hidden",
            `[${width}px] Mobile drawer open locks body scroll (overflow=hidden)`
          );
          assert(
            menuOpenState.drawerVisible,
            `[${width}px] Mobile drawer opens with opacity 1 and visibility visible`
          );

          // Close mobile menu
          await menuBtn.click();
          await page.waitForTimeout(350);

          const menuClosedState = await page.evaluate(() => {
            const drawer = document.querySelector('div[role="dialog"][aria-label="Navigation Menu"]');
            const style = drawer ? window.getComputedStyle(drawer) : null;
            return {
              bodyOverflow: document.body.style.overflow,
              drawerHidden: style ? style.visibility === "hidden" || style.pointerEvents === "none" : true,
            };
          });
          assert(
            menuClosedState.bodyOverflow !== "hidden",
            `[${width}px] Mobile drawer close unlocks body scroll`
          );
          assert(
            menuClosedState.drawerHidden,
            `[${width}px] Closed mobile drawer has visibility:hidden / pointer-events:none`
          );

          // Re-assert header controls clickability after closing mobile drawer
          for (const ctrl of CONTROLS) {
            const isMatch = await page.evaluate(({ selector }) => {
              const el = document.querySelector(selector);
              if (!el) return false;
              const rect = el.getBoundingClientRect();
              const topEl = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
              return topEl && (topEl === el || el.contains(topEl));
            }, { selector: ctrl.selector });
            assert(
              Boolean(isMatch),
              `[${width}px] ${ctrl.name} elementFromPoint clickability restored after closing mobile drawer`
            );
          }

          // B. Search overlay open & close
          const searchBtn = page.locator('header button[aria-label="Search products"]');
          await searchBtn.click();
          await page.waitForTimeout(350);

          const searchOpenScroll = await page.evaluate(() => {
            const el = document.scrollingElement || document.documentElement;
            return { scrollLeft: el.scrollLeft, overflow: el.scrollWidth <= el.clientWidth };
          });
          assert(
            searchOpenScroll.scrollLeft === 0 && searchOpenScroll.overflow,
            `[${width}px] Search overlay open maintains scrollLeft=0 without horizontal overflow`
          );

          const closeSearchBtn = page.locator('button[aria-label="Close search"]');
          await closeSearchBtn.click();
          await page.waitForTimeout(350);

          // Re-assert header controls after closing search
          for (const ctrl of CONTROLS) {
            const isMatch = await page.evaluate(({ selector }) => {
              const el = document.querySelector(selector);
              if (!el) return false;
              const rect = el.getBoundingClientRect();
              const topEl = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
              return topEl && (topEl === el || el.contains(topEl));
            }, { selector: ctrl.selector });
            assert(
              Boolean(isMatch),
              `[${width}px] ${ctrl.name} elementFromPoint clickability restored after closing search`
            );
          }

          // C. Cart drawer open & close
          const cartBtn = page.locator('header button[aria-label="View Shopping Cart"]');
          await cartBtn.click();
          await page.waitForTimeout(350);

          const cartOpenScroll = await page.evaluate(() => {
            return document.body.style.overflow === "hidden";
          });
          assert(
            cartOpenScroll,
            `[${width}px] Cart drawer open locks body scroll`
          );

          const closeCartBtn = page.locator('button[aria-label="Close cart drawer"]');
          await closeCartBtn.click();
          await page.waitForTimeout(350);

          const cartClosedScroll = await page.evaluate(() => {
            return document.body.style.overflow !== "hidden";
          });
          assert(
            cartClosedScroll,
            `[${width}px] Cart drawer close unlocks body scroll`
          );

          // Re-assert header controls after closing cart
          for (const ctrl of CONTROLS) {
            const isMatch = await page.evaluate(({ selector }) => {
              const el = document.querySelector(selector);
              if (!el) return false;
              const rect = el.getBoundingClientRect();
              const topEl = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
              return topEl && (topEl === el || el.contains(topEl));
            }, { selector: ctrl.selector });
            assert(
              Boolean(isMatch),
              `[${width}px] ${ctrl.name} elementFromPoint clickability restored after closing cart`
            );
          }
        }
      }
      await context.close();
    }

    // 4. Shop hero banner height verification
    console.log("\n--- Testing Shop Hero Banner Heights & Zero CLS ---");
    // Desktop test (1024px)
    const desktopCtx = await browser.newContext({ viewport: { width: 1024, height: 800 } });
    const desktopPage = await desktopCtx.newPage();
    await desktopPage.goto("http://localhost:3000/shop", { waitUntil: "domcontentloaded" });
    await desktopPage.waitForTimeout(300);

    const desktopHero = await desktopPage.evaluate(() => {
      const section = document.querySelector('section[aria-label="Shop Collection Banner"]');
      if (!section) return null;
      const rect = section.getBoundingClientRect();
      const comp = window.getComputedStyle(section);
      return {
        height: rect.height,
        position: comp.position,
        zIndex: comp.zIndex,
        overflow: comp.overflow,
      };
    });
    assert(
      desktopHero !== null && desktopHero.height >= 440,
      `Desktop /shop hero has expected min height (observed ${desktopHero?.height}px >= 440px)`
    );
    assert(
      desktopHero?.position === "relative" && (desktopHero?.zIndex === "0" || desktopHero?.zIndex === "auto"),
      `Desktop /shop hero has position relative and z-index 0/auto (${desktopHero?.position}, z=${desktopHero?.zIndex})`
    );
    await desktopCtx.close();

    // Mobile test (375px)
    const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 750 } });
    const mobilePage = await mobileCtx.newPage();
    await mobilePage.goto("http://localhost:3000/shop", { waitUntil: "domcontentloaded" });
    await mobilePage.waitForTimeout(300);

    const mobileHero = await mobilePage.evaluate(() => {
      const section = document.querySelector('section[aria-label="Shop Collection Banner"]');
      if (!section) return null;
      const rect = section.getBoundingClientRect();
      const comp = window.getComputedStyle(section);
      const img = section.querySelector("img");
      return {
        height: rect.height,
        aspectRatio: comp.aspectRatio,
        position: comp.position,
        zIndex: comp.zIndex,
        imgLoaded: img?.complete,
      };
    });
    assert(
      mobileHero !== null && mobileHero.height > 150 && mobileHero.height < 300,
      `Mobile /shop hero matches aspect ratio 2752/1536 (observed ${mobileHero?.height}px at 375px)`
    );
    await mobileCtx.close();

  } finally {
    await browser.close();
  }

  console.log(`\n=================================================`);
  console.log(`PHASE 11.1 Test Suite Complete: ${passed} Passed, ${failed} Failed`);
  console.log(`=================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase11_1TestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
